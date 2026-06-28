import { PrismaClient, Category } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not configured!");
  process.exit(1);
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY || TMDB_API_KEY === "your-tmdb-api-key-here") {
  console.error("TMDB_API_KEY is not configured! Aborting refresh job.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Standard TMDB Genre mappings
const GENRES = [
  { name: "Action", movieId: 28, tvId: 10759 },
  { name: "Comedy", movieId: 35, tvId: 35 },
  { name: "Drama", movieId: 18, tvId: 18 },
  { name: "Horror", movieId: 27, tvId: 9648 }, // TV horror fallback is Mystery (9648)
  { name: "Sci-Fi", movieId: 878, tvId: 10765 },
  { name: "Animation", movieId: 16, tvId: 16 },
  { name: "Documentary", movieId: 99, tvId: 99 },
  { name: "Thriller", movieId: 53, tvId: 9648 },
  { name: "Romance", movieId: 10749, tvId: 10766 },
];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: Auto-import media item from TMDB
async function getOrImportMediaItem(externalId: string, category: Category, systemUserId: string): Promise<string> {
  const existing = await prisma.mediaItem.findUnique({
    where: {
      externalSource_externalId: {
        externalSource: "tmdb",
        externalId: String(externalId),
      },
    },
  });

  if (existing) {
    return existing.id;
  }

  // Fetch full details and insert
  let title = "";
  let year = new Date().getFullYear();
  let posterUrl: string | null = null;
  let description = "";
  let creatorOrStudio = "Unknown";

  await delay(100); // Small rate-limit delay

  if (category === Category.MOVIE) {
    const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${externalId}?api_key=${TMDB_API_KEY}`);
    if (!detailRes.ok) throw new Error(`TMDB Movie details failed for ID ${externalId}`);
    const m = await detailRes.json();
    
    title = m.title || m.original_title || "Untitled Movie";
    year = m.release_date ? parseInt(m.release_date.split("-")[0]) : new Date().getFullYear();
    posterUrl = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null;
    description = m.overview || "";

    // Fetch credits for Director name
    try {
      const creditsRes = await fetch(`${TMDB_BASE_URL}/movie/${externalId}/credits?api_key=${TMDB_API_KEY}`);
      if (creditsRes.ok) {
        const credits = await creditsRes.json();
        const director = (credits.crew || []).find((c: any) => c.job === "Director");
        if (director) {
          creatorOrStudio = director.name;
        } else if (m.production_companies && m.production_companies.length > 0) {
          creatorOrStudio = m.production_companies[0].name;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch credits for Movie ${externalId}:`, err);
    }
  } else {
    const detailRes = await fetch(`${TMDB_BASE_URL}/tv/${externalId}?api_key=${TMDB_API_KEY}`);
    if (!detailRes.ok) throw new Error(`TMDB TV details failed for ID ${externalId}`);
    const t = await detailRes.json();

    title = t.name || t.original_name || "Untitled TV Show";
    year = t.first_air_date ? parseInt(t.first_air_date.split("-")[0]) : new Date().getFullYear();
    posterUrl = t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null;
    description = t.overview || "";

    if (t.created_by && t.created_by.length > 0) {
      creatorOrStudio = t.created_by[0].name;
    } else if (t.production_companies && t.production_companies.length > 0) {
      creatorOrStudio = t.production_companies[0].name;
    }
  }

  // Check for local duplicate by title + category (to link manual entries)
  const localDuplicate = await prisma.mediaItem.findFirst({
    where: {
      title: { equals: title.trim(), mode: "insensitive" },
      category,
    },
  });

  if (localDuplicate) {
    const updated = await prisma.mediaItem.update({
      where: { id: localDuplicate.id },
      data: {
        externalSource: "tmdb",
        externalId: String(externalId),
        posterUrl: localDuplicate.posterUrl || posterUrl,
        description: localDuplicate.description || description,
      },
    });
    return updated.id;
  }

  // Create new MediaItem
  const created = await prisma.mediaItem.create({
    data: {
      title: title.trim(),
      category,
      year,
      creatorOrStudio: creatorOrStudio.trim(),
      posterUrl,
      description: description.trim(),
      externalSource: "tmdb",
      externalId: String(externalId),
      createdByUserId: systemUserId,
    },
  });

  return created.id;
}

export async function refreshPopularContent() {
  console.log("Beginning refresh-popular content upsert...");

  // 1. Get or create a System User account to assign as the creator of auto-imported items
  let systemUser = await prisma.user.findFirst({
    where: { email: "system@sanima.com" },
  });

  if (!systemUser) {
    systemUser = await prisma.user.findFirst(); // Fallback to first user in database
  }

  if (!systemUser) {
    // If database is completely empty of users, create a default system user
    systemUser = await prisma.user.create({
      data: {
        name: "Sanima System",
        email: "system@sanima.com",
        passwordHash: "$2a$10$Qn/VbN4fI1QYqU5xOOmU9eZ47Q1i1i1i1i1i1i1i1i1i1i1i1i1i", // dummy hash
        bio: "Automated content generation account",
      },
    });
  }

  const systemUserId = systemUser.id;
  const now = new Date();

  // 2. Fetch "Trending Now" content (Top 10 Movie + Top 10 TV popular merged)
  console.log("\nFetching Trending Now popular items...");
  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`),
    ]);

    if (!moviesRes.ok || !tvRes.ok) throw new Error("Failed to fetch general popular items from TMDB");

    const movieData = await moviesRes.json();
    const tvData = await tvRes.json();

    const movieItems = (movieData.results || []).slice(0, 10).map((m: any) => ({
      externalId: String(m.id),
      category: Category.MOVIE,
      popularity: m.popularity || 0.0,
    }));

    const tvItems = (tvData.results || []).slice(0, 10).map((t: any) => ({
      externalId: String(t.id),
      category: Category.TV_SHOW,
      popularity: t.popularity || 0.0,
    }));

    // Merge and sort
    const trendingItems = [...movieItems, ...tvItems].sort((a, b) => b.popularity - a.popularity);

    let rank = 1;
    for (const item of trendingItems) {
      try {
        const mediaId = await getOrImportMediaItem(item.externalId, item.category, systemUserId);
        await prisma.popularityCache.upsert({
          where: {
            mediaId_genre: { mediaId, genre: "Trending" },
          },
          update: {
            tmdbPopularityScore: item.popularity,
            rankInGenre: rank,
            lastRefreshedAt: now,
          },
          create: {
            mediaId,
            genre: "Trending",
            category: item.category,
            tmdbPopularityScore: item.popularity,
            rankInGenre: rank,
            lastRefreshedAt: now,
          },
        });
        rank++;
      } catch (err) {
        console.error(`Failed to upsert trending item TMDB ID ${item.externalId}:`, err);
      }
    }
    console.log("Successfully updated 'Trending' row in cache.");
  } catch (trendingErr) {
    console.error("Failed to refresh trending items:", trendingErr);
  }

  // 3. Fetch each Genre category (Action, Comedy, Drama, etc.)
  for (const genre of GENRES) {
    console.log(`\nFetching popular items for genre: ${genre.name}...`);
    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genre.movieId}&sort_by=popularity.desc`),
        fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genre.tvId}&sort_by=popularity.desc`),
      ]);

      if (!moviesRes.ok || !tvRes.ok) {
        console.error(`Failed to discover popular items for genre ${genre.name}`);
        continue;
      }

      const movieData = await moviesRes.json();
      const tvData = await tvRes.json();

      const movieItems = (movieData.results || []).slice(0, 10).map((m: any) => ({
        externalId: String(m.id),
        category: Category.MOVIE,
        popularity: m.popularity || 0.0,
      }));

      const tvItems = (tvData.results || []).slice(0, 10).map((t: any) => ({
        externalId: String(t.id),
        category: Category.TV_SHOW,
        popularity: t.popularity || 0.0,
      }));

      // Merge and sort
      const combinedItems = [...movieItems, ...tvItems]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 15); // Keep top 15 in combined list

      let rank = 1;
      for (const item of combinedItems) {
        try {
          const mediaId = await getOrImportMediaItem(item.externalId, item.category, systemUserId);
          await prisma.popularityCache.upsert({
            where: {
              mediaId_genre: { mediaId, genre: genre.name },
            },
            update: {
              tmdbPopularityScore: item.popularity,
              rankInGenre: rank,
              lastRefreshedAt: now,
            },
            create: {
              mediaId,
              genre: genre.name,
              category: item.category,
              tmdbPopularityScore: item.popularity,
              rankInGenre: rank,
              lastRefreshedAt: now,
            },
          });
          rank++;
        } catch (err) {
          console.error(`Failed to upsert genre ${genre.name} item TMDB ID ${item.externalId}:`, err);
        }
      }
      console.log(`Successfully updated '${genre.name}' row in cache.`);
    } catch (genreErr) {
      console.error(`Failed to refresh genre ${genre.name} items:`, genreErr);
    }
  }

  // 4. Delete old records that were not updated in this run (optional cleanup)
  try {
    const deleted = await prisma.popularityCache.deleteMany({
      where: {
        lastRefreshedAt: { lt: new Date(now.getTime() - 5 * 60 * 1000) }, // older than 5 minutes
      },
    });
    console.log(`\nCleaned up ${deleted.count} old popularity cache rows.`);
  } catch (cleanErr) {
    console.error("Cleanup of old cache failed:", cleanErr);
  }

  console.log("\nPopularity cache refresh finished successfully!");
}

if (require.main === module) {
  (async () => {
    try {
      await refreshPopularContent();
      await prisma.$disconnect();
      await pool.end();
    } catch (err) {
      console.error("Refresh job execution failed:", err);
      process.exit(1);
    }
  })();
}
