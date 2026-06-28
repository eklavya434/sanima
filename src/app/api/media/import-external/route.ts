import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Category } from "@prisma/client";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { externalId, category } = body;

    if (!externalId || !category) {
      return NextResponse.json({ error: "Missing externalId or category" }, { status: 400 });
    }

    // 1. Deduplication check on external ID
    const existing = await prisma.mediaItem.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: "tmdb",
          externalId: String(externalId),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }

    if (!TMDB_API_KEY || TMDB_API_KEY === "your-tmdb-api-key-here") {
      return NextResponse.json({ error: "TMDB API key is not configured" }, { status: 500 });
    }

    // 2. Fetch full details
    let title = "";
    let year = new Date().getFullYear();
    let posterUrl: string | null = null;
    let description = "";
    let creatorOrStudio = "Unknown";

    const targetCategory = category === "MOVIE" ? "MOVIE" : "TV_SHOW";

    if (targetCategory === "MOVIE") {
      const detailRes = await fetch(`${TMDB_BASE_URL}/movie/${externalId}?api_key=${TMDB_API_KEY}`);
      if (!detailRes.ok) {
        throw new Error("Failed to fetch movie details from TMDB");
      }
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
      } catch (creditsErr) {
        console.error("Failed to fetch credits, falling back:", creditsErr);
        if (m.production_companies && m.production_companies.length > 0) {
          creatorOrStudio = m.production_companies[0].name;
        }
      }
    } else {
      // TV_SHOW / WEB_SERIES / TV_SERIAL all maps to TV endpoint
      const detailRes = await fetch(`${TMDB_BASE_URL}/tv/${externalId}?api_key=${TMDB_API_KEY}`);
      if (!detailRes.ok) {
        throw new Error("Failed to fetch TV details from TMDB");
      }
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

    // Check if an item with same title and category already exists locally (e.g. added manually prior to this import)
    const localDuplicate = await prisma.mediaItem.findFirst({
      where: {
        title: { equals: title.trim(), mode: "insensitive" },
        category: targetCategory as Category,
      },
    });

    if (localDuplicate) {
      // Auto-link externalSource/externalId to the manually created duplicate
      const updated = await prisma.mediaItem.update({
        where: { id: localDuplicate.id },
        data: {
          externalSource: "tmdb",
          externalId: String(externalId),
        },
      });
      return NextResponse.json({ id: updated.id });
    }

    // 3. Create new MediaItem
    const item = await prisma.mediaItem.create({
      data: {
        title: title.trim(),
        category: targetCategory as Category,
        year,
        creatorOrStudio: creatorOrStudio.trim(),
        posterUrl,
        description: description.trim(),
        externalSource: "tmdb",
        externalId: String(externalId),
        createdByUserId: (session.user as any).id,
      },
    });

    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error: any) {
    console.error("POST Import External Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
