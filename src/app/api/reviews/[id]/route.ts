import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SceneNoteType } from "@prisma/client";

const sceneNoteInputSchema = z.object({
  type: z.nativeEnum(SceneNoteType),
  rank: z.number().int().min(1).max(5).nullable().optional(),
  episodeLabel: z.string().nullable().optional(),
  timestampLabel: z.string().nullable().optional(),
  content: z.string().min(1, "Content is required"),
});

const editReviewSchema = z.object({
  rating: z.number().min(1).max(10),
  body: z.string().optional().or(z.literal("")),
  rewatched: z.boolean(),
  sceneNotes: z.array(sceneNoteInputSchema).optional().default([]),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        media: true,
        sceneNotes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("GET Review Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this review" }, { status: 403 });
    }

    const body = await req.json();
    const validated = editReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const { rating, body: reviewBody, rewatched, sceneNotes } = validated.data;

    const updatedReview = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          rating,
          body: reviewBody || null,
          rewatched,
        },
      });

      await tx.sceneNote.deleteMany({
        where: { reviewId: id },
      });

      if (sceneNotes && sceneNotes.length > 0) {
        await tx.sceneNote.createMany({
          data: sceneNotes.map((note) => ({
            reviewId: id,
            type: note.type,
            rank: note.rank || null,
            episodeLabel: note.episodeLabel || null,
            timestampLabel: note.timestampLabel || null,
            content: note.content,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("PUT Review Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this review" }, { status: 403 });
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("DELETE Review Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
