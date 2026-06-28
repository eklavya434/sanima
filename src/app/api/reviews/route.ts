import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SceneNoteType, Category } from "@prisma/client";

const sceneNoteInputSchema = z.object({
  type: z.nativeEnum(SceneNoteType),
  rank: z.number().int().min(1).max(5).nullable().optional(),
  episodeLabel: z.string().nullable().optional(),
  timestampLabel: z.string().nullable().optional(),
  content: z.string().min(1, "Content is required"),
});

const reviewSchema = z.object({
  mediaId: z.string().uuid("Invalid media ID"),
  rating: z.number().min(1, "Rating must be at least 1").max(10, "Rating cannot exceed 10"),
  body: z.string().optional().or(z.literal("")),
  rewatched: z.boolean().default(false),
  sceneNotes: z.array(sceneNoteInputSchema).optional().default([]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("mediaId");
    const userId = searchParams.get("userId");
    const category = searchParams.get("category");

    const where: any = {};

    if (mediaId) where.mediaId = mediaId;
    if (userId) where.userId = userId;
    if (category && category !== "ALL") {
      where.media = { category: category as Category };
    }

    const reviews = await prisma.review.findMany({
      where,
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
            creatorOrStudio: true,
            posterUrl: true,
          },
        },
        sceneNotes: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 1. Rate Limiting Check (Database-backed)
    const lastReview = await prisma.review.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastReview) {
      const diffMs = Date.now() - new Date(lastReview.createdAt).getTime();
      const limitMs = 10 * 1000; // 10 seconds limit
      if (diffMs < limitMs) {
        const waitSec = Math.ceil((limitMs - diffMs) / 1000);
        return NextResponse.json(
          { error: `Rate limit exceeded. Please wait ${waitSec}s before posting again.` },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const validated = reviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const { mediaId, rating, body: reviewBody, rewatched, sceneNotes } = validated.data;

    // Check unique constraint: one review per user per item
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_mediaId: {
          userId,
          mediaId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this item. You can edit your existing review instead." },
        { status: 409 }
      );
    }

    // Execute in a transaction to ensure atomic inserts of review & notes
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          mediaId,
          rating,
          body: reviewBody || null,
          rewatched,
        },
      });

      if (sceneNotes && sceneNotes.length > 0) {
        await tx.sceneNote.createMany({
          data: sceneNotes.map((note) => ({
            reviewId: newReview.id,
            type: note.type,
            rank: note.rank || null,
            episodeLabel: note.episodeLabel || null,
            timestampLabel: note.timestampLabel || null,
            content: note.content,
          })),
        });
      }

      return newReview;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST Review Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
