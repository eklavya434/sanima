import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const commentSchema = z.object({
  body: z.string().min(1, "Comment body cannot be empty").max(1000, "Comment cannot exceed 1000 characters"),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const reviewId = params.id;

    const comments = await prisma.comment.findMany({
      where: { reviewId },
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
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET Comments Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = params.id;
    const userId = (session.user as any).id;

    const body = await req.json();
    const validated = commentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        body: validated.data.body.trim(),
        userId,
        reviewId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST Comment Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
