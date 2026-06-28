import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = params.id;
    const userId = (session.user as any).id;

    const existing = await prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (existing) {
      await prisma.like.delete({
        where: {
          id: existing.id,
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId,
          reviewId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("POST Like Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
