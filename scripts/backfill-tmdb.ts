import { PrismaClient, Category } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required!");
  process.exit(1);
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY || TMDB_API_KEY === "your-tmdb-api-key-here") {
  console.warn("WARNING: TMDB_API_KEY is not configured. TMDB searches will fail.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting TMDB metadata backfill...");

  if (!TMDB_API_KEY) {
    console.error("Aborting backfill: TMDB_API_KEY is missing.");
    process.exit(1);
  }

  // 1. Fetch all movies, TV shows, web series, and serials lacking posterUrl
  const itemsToBackfill = await prisma.mediaItem.findMany({
    where: {
      category: {
        in: [Category.MOVIE, Category.TV_SHOW, Category.WEB_SERIES, Category.TV_SERIAL],
      },
      OR: [
        { posterUrl: null },
        { description: "" },
      ],
    },
  });

  console.log(`Found ${itemsToBackfill.length} items requiring backfill.`);

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const item of itemsToBackfill) {
    console.log(`\nSearching TMDB for: "${item.title}" (${item.year}) [${item.category}]...`);
    
    // Rate limit safeguard: sleep for 250ms between requests (approx. 4 requests per second)
    await delay(250);

    try {
      const isMovie = item.category === Category.MOVIE;
      const searchEndpoint = isMovie ? "movie" : "tv";
      
      let searchUrl = `${TMDB_BASE_URL}/search/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.title)}`;
      if (item.year) {
        searchUrl += isMovie 
          ? `&primary_release_year=${item.year}` 
          : `&first_air_date_year=${item.year}`;
      }

      const res = await fetch(searchUrl);
      if (!res.ok) {
        console.error(`TMDB search failed for "${item.title}": HTTP ${res.status}`);
        unmatchedCount++;
        continue;
      }

      const data = await res.json();
      const results = data.results || [];

      // Find a confident match (exact title match, case-insensitive, matching year)
      const confidentMatch = results.find((r: any) => {
        const matchTitle = isMovie ? r.title : r.name;
        const matchDate = isMovie ? r.release_date : r.first_air_date;
        const matchYear = matchDate ? parseInt(matchDate.split("-")[0]) : null;

        const isTitleMatch = matchTitle?.toLowerCase().trim() === item.title.toLowerCase().trim();
        const isYearMatch = item.year ? matchYear === item.year : true;

        return isTitleMatch && isYearMatch;
      });

      if (!confidentMatch) {
        console.log(`❌ No confident match found on TMDB for "${item.title}" (${item.year}). Skipping for manual review.`);
        unmatchedCount++;
        continue;
      }

      console.log(`✅ Confident match found: "${isMovie ? confidentMatch.title : confidentMatch.name}" (${isMovie ? confidentMatch.release_date : confidentMatch.first_air_date}) [ID: ${confidentMatch.id}]`);

      // Fetch full details to check for director or production studio
      let creatorOrStudio = item.creatorOrStudio;
      if (item.creatorOrStudio === "Unknown" || item.creatorOrStudio === "") {
        await delay(100); // Small rate-limit delay
        if (isMovie) {
          try {
            const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${confidentMatch.id}/credits?api_key=${TMDB_API_KEY}`);
            if (creditsRes.ok) {
              const credits = await creditsRes.json();
              const director = (credits.crew || []).find((c: any) => c.job === "Director");
              if (director) creatorOrStudio = director.name;
            }
          } catch (creditsErr) {
            console.error(`Credits fetch failed for movie ID ${confidentMatch.id}:`, creditsErr);
          }
        } else {
          try {
            const detailRes = await fetch(`${TMDB_BASE_URL}/tv/${confidentMatch.id}?api_key=${TMDB_API_KEY}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              if (detail.created_by && detail.created_by.length > 0) {
                creatorOrStudio = detail.created_by[0].name;
              } else if (detail.production_companies && detail.production_companies.length > 0) {
                creatorOrStudio = detail.production_companies[0].name;
              }
            }
          } catch (detailErr) {
            console.error(`Details fetch failed for TV ID ${confidentMatch.id}:`, detailErr);
          }
        }
      }

      // Map TMDB fields
      const posterUrl = confidentMatch.poster_path 
        ? `https://image.tmdb.org/t/p/w500${confidentMatch.poster_path}` 
        : item.posterUrl;
      const description = confidentMatch.overview || item.description;

      // Update item in database
      await prisma.mediaItem.update({
        where: { id: item.id },
        data: {
          posterUrl,
          description: description.trim(),
          creatorOrStudio: creatorOrStudio.trim(),
          externalSource: "tmdb",
          externalId: String(confidentMatch.id),
        },
      });

      console.log(`💾 Updated record in database successfully!`);
      matchedCount++;

    } catch (err) {
      console.error(`Error processing "${item.title}":`, err);
      unmatchedCount++;
    }
  }

  console.log("\n-------------------------------------------");
  console.log("Backfill operation complete.");
  console.log(`Total matched & updated: ${matchedCount}`);
  console.log(`Total skipped/unmatched: ${unmatchedCount}`);
  console.log("-------------------------------------------");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
