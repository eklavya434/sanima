import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { userId: id },
      include: {
        media: {
          select: {
            category: true,
          },
        },
      },
    });

    const reviewsCount = reviews.length;
    const averageRating =
      reviewsCount > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
        : null;

    // Calculate favorite category
    const categoryCounts: { [key: string]: number } = {};
    for (const r of reviews) {
      const cat = r.media.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    let favoriteCategory = null;
    let maxCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = cat;
      }
    }

    return NextResponse.json({
      ...user,
      stats: {
        reviewsCount,
        averageRating,
        favoriteCategory,
      },
    });
  } catch (error) {
    console.error("GET User Profile Error:", error);
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
    const currentUserId = (session.user as any).id;

    if (id !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: Cannot edit another user's profile" }, { status: 403 });
    }

    const body = await req.json();
    const validated = editProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const { name, avatarUrl, bio } = validated.data;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT User Profile Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
