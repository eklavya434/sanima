import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Category } from "@prisma/client";

const mediaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.nativeEnum(Category),
  year: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 5),
  creatorOrStudio: z.string().min(1, "Creator or studio is required"),
  posterUrl: z.string().optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
  externalUrl: z.string().optional().or(z.literal("")),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const year = searchParams.get("year");

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { creatorOrStudio: { contains: q, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL" && Object.values(Category).includes(category as Category)) {
      where.category = category as Category;
    }

    if (year) {
      where.year = parseInt(year);
    }

    const items = await prisma.mediaItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET Media Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = mediaSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0].message }, { status: 400 });
    }

    const { title, category, year, creatorOrStudio, posterUrl, description, externalUrl } = validated.data;

    // Case-insensitive deduplication check on (title, category)
    const existing = await prisma.mediaItem.findFirst({
      where: {
        title: { equals: title.trim(), mode: "insensitive" },
        category: category,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A media item with title "${title}" in category "${category}" already exists.`, id: existing.id },
        { status: 409 }
      );
    }

    const item = await prisma.mediaItem.create({
      data: {
        title: title.trim(),
        category,
        year,
        creatorOrStudio: creatorOrStudio.trim(),
        posterUrl: posterUrl || null,
        description: description.trim(),
        externalUrl: externalUrl || null,
        createdByUserId: (session.user as any).id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST Media Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
