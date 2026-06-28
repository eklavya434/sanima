import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const sceneNotes = await prisma.sceneNote.findMany({
      where: {
        review: {
          mediaId: id,
        },
      },
      include: {
        review: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const groups: {
      [key: string]: {
        episodeLabel: string | null;
        timestampLabel: string | null;
        count: number;
        type: string;
        notes: Array<{
          id: string;
          content: string;
          user: {
            id: string;
            name: string;
            avatarUrl: string | null;
          };
          reviewId: string;
          rating: number;
          type: string;
          rank: number | null;
        }>;
      };
    } = {};

    for (const note of sceneNotes) {
      const ep = note.episodeLabel ? note.episodeLabel.trim().toUpperCase() : "";
      const ts = note.timestampLabel ? note.timestampLabel.trim() : "";

      let key = "";
      // If we have an episode or timestamp label, we group by it
      if (ep || ts) {
        key = `${ep}||${ts}`;
      } else {
        // Otherwise, it is listed individually (ungrouped)
        key = `unique-${note.id}`;
      }

      if (!groups[key]) {
        groups[key] = {
          episodeLabel: note.episodeLabel || null,
          timestampLabel: note.timestampLabel || null,
          count: 0,
          type: note.type,
          notes: [],
        };
      }

      groups[key].count += 1;
      groups[key].notes.push({
        id: note.id,
        content: note.content,
        user: {
          id: note.review.user.id,
          name: note.review.user.name,
          avatarUrl: note.review.user.avatarUrl,
        },
        reviewId: note.reviewId,
        rating: note.review.rating,
        type: note.type,
        rank: note.rank,
      });
    }

    const sortedGroups = Object.values(groups).sort((a, b) => b.count - a.count);

    return NextResponse.json(sortedGroups);
  } catch (error) {
    console.error("GET Scene Aggregation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
