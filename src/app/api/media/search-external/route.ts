import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Category } from "@prisma/client";

export const dynamic = "force-dynamic";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Simple in-memory cache for TMDB results
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "ALL";
    const year = searchParams.get("year") || "";

    if (!q.trim()) {
      return NextResponse.json({ local: [], tmdb: [] });
    }

    // 1. Fetch Local DB Matches
    const localWhere: any = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { creatorOrStudio: { contains: q, mode: "insensitive" } },
      ],
    };

    if (category !== "ALL" && Object.values(Category).includes(category as Category)) {
      localWhere.category = category as Category;
    }

    if (year) {
      localWhere.year = parseInt(year);
    }

    const localItems = await prisma.mediaItem.findMany({
      where: localWhere,
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch TMDB Matches (only for MOVIE, TV_SHOW, WEB_SERIES, TV_SERIAL, or ALL)
    const isTMDBCompatible =
      category === "ALL" ||
      ["MOVIE", "TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(category);

    let externalResults: any[] = [];

    if (isTMDBCompatible && TMDB_API_KEY && TMDB_API_KEY !== "your-tmdb-api-key-here") {
      const cacheKey = `${q}-${category}-${year}`;
      const cached = cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        externalResults = cached.data;
      } else {
        try {
          const searchPromises: Promise<any>[] = [];
          const searchMovie = category === "ALL" || category === "MOVIE";
          const searchTV = category === "ALL" || ["TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(category);

          if (searchMovie) {
            let movieUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
            if (year) movieUrl += `&primary_release_year=${year}`;
            searchPromises.push(
              fetch(movieUrl)
                .then((r) => r.json())
                .then((data) =>
                  (data.results || []).map((m: any) => ({
                    id: String(m.id),
                    title: m.title,
                    category: "MOVIE",
                    year: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
                    posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                    description: m.overview || "",
                  }))
                )
            );
          }

          if (searchTV) {
            let tvUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
            if (year) tvUrl += `&first_air_date_year=${year}`;
            searchPromises.push(
              fetch(tvUrl)
                .then((r) => r.json())
                .then((data) =>
                  (data.results || []).map((t: any) => ({
                    id: String(t.id),
                    title: t.name,
                    category: "TV_SHOW", // Default imported TV to TV_SHOW category
                    year: t.first_air_date ? parseInt(t.first_air_date.split("-")[0]) : null,
                    posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
                    description: t.overview || "",
                  }))
                )
            );
          }

          const resultsArray = await Promise.all(searchPromises);
          externalResults = resultsArray.flat().sort((a, b) => (b.year || 0) - (a.year || 0));

          // Cache the query results
          cache.set(cacheKey, { timestamp: Date.now(), data: externalResults });
        } catch (err) {
          console.error("TMDB API fetch failed, bailing gracefully:", err);
          externalResults = [];
        }
      }
    }

    return NextResponse.json({
      local: localItems,
      tmdb: externalResults,
    });
  } catch (error) {
    console.error("GET Search External Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
