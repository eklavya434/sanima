import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Category } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const mediaItem = await prisma.mediaItem.findUnique({
      where: { id },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const reviewsCount = mediaItem.reviews.length;
    const averageRating =
      reviewsCount > 0
        ? mediaItem.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
        : null;

    const { reviews, ...details } = mediaItem;

    return NextResponse.json({
      ...details,
      reviewsCount,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
    });
  } catch (error) {
    console.error("GET Media Detail Error:", error);
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
    const body = await req.json();
    const { category } = body;

    if (!category || !Object.values(Category).includes(category as Category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: {
        category: category as Category,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Media Detail Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
