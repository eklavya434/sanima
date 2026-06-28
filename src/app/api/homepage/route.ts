import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GENRES_LIST = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Animation", "Documentary", "Thriller", "Romance"];

export async function GET() {
  try {
    // 1. Fetch all popularity cache records in a single query
    const cacheItems = await prisma.popularityCache.findMany({
      where: {
        genre: {
          in: ["Trending", ...GENRES_LIST],
        },
      },
      include: {
        media: {
          include: {
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        rankInGenre: "asc",
      },
    });

    // Helper to calculate average rating of a media item
    const mapMediaItem = (item: any) => {
      const media = item.media;
      if (!media) return null;
      
      const reviewsCount = media.reviews.length;
      const averageRating =
        reviewsCount > 0
          ? parseFloat((media.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsCount).toFixed(1))
          : null;

      const { reviews, ...details } = media;
      return {
        ...details,
        averageRating,
        reviewsCount,
      };
    };

    // Group items by genre in JS
    const trending = cacheItems
      .filter((item) => item.genre === "Trending")
      .map(mapMediaItem)
      .filter(Boolean);

    const genres: Record<string, any[]> = {};
    for (const genreName of GENRES_LIST) {
      genres[genreName] = cacheItems
        .filter((item) => item.genre === genreName)
        .map(mapMediaItem)
        .filter(Boolean);
    }

    // 2. Fetch recent reviews for user activity
    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        media: {
          select: {
            id: true,
            title: true,
            category: true,
            year: true,
            posterUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      trending,
      genres,
      recentReviews,
    });
  } catch (error) {
    console.error("GET Homepage API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
