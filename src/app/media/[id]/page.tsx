"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import SceneNoteCard from "@/components/SceneNoteCard";
import Link from "next/link";
import {
  Film,
  Star,
  ExternalLink,
  MessageSquare,
  Heart,
  TrendingUp,
  Clock,
  Tv,
  Plus,
  Loader2,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

export default function MediaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [media, setMedia] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [aggregation, setAggregation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingUserReview, setExistingUserReview] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mediaRes, reviewsRes, aggRes] = await Promise.all([
        fetch(`/api/media/${id}`),
        fetch(`/api/reviews?mediaId=${id}`),
        fetch(`/api/media/${id}/scene-aggregation`),
      ]);

      if (mediaRes.ok && reviewsRes.ok && aggRes.ok) {
        const mediaData = await mediaRes.json();
        const reviewsData = await reviewsRes.json();
        const aggData = await aggRes.json();

        setMedia(mediaData);
        setReviews(reviewsData);
        setAggregation(aggData);

        if (session?.user) {
          const currentUserId = (session.user as any).id;
          const userRev = reviewsData.find((r: any) => r.userId === currentUserId);
          if (userRev) {
            setExistingUserReview(userRev);
          }
        }
      } else {
        router.push("/404");
      }
    } catch (error) {
      console.error("Failed to load media details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, session]);

  const handleLikeToggle = async (reviewId: string) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const reviewsRes = await fetch(`/api/reviews?mediaId=${id}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!media) return null;

  return (
    <div className="space-y-10">
      {/* 1. Main Media Poster and Hero Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Left Column - Poster, Rating, CTA */}
        <div className="md:col-span-1 space-y-6">
          <div className="aspect-[2/3] w-full rounded-2xl bg-gray-900 border border-gray-800 shadow-xl overflow-hidden relative flex items-center justify-center">
            {media.posterUrl ? (
              <img src={media.posterUrl} alt={media.title} className="w-full h-full object-cover" />
            ) : (
              <Film className="w-16 h-16 text-gray-700" />
            )}
          </div>

          {/* Average Rating Box */}
          <div className="bg-[#151821] p-5 rounded-2xl border border-gray-800/60 text-center space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Average Rating</span>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-[#E8A33D]">
              <Star className="w-6 h-6 fill-[#E8A33D] stroke-[1.5]" />
              <span className="text-3xl font-black font-mono">
                {media.averageRating ? media.averageRating : "-.-"}
              </span>
              <span className="text-sm text-gray-500 font-mono mt-2">/10</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Based on {media.reviewsCount} {media.reviewsCount === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3">
            {existingUserReview ? (
              <Link
                href={`/review/new?mediaId=${media.id}`}
                className="w-full text-center py-3 bg-gray-850 hover:bg-gray-850 text-gray-200 border border-gray-800 rounded-lg text-sm font-bold uppercase tracking-wider transition"
              >
                Edit Your Review
              </Link>
            ) : (
              <Link
                href={session ? `/review/new?mediaId=${media.id}` : "/auth/signin"}
                className="w-full text-center py-3 bg-[#E8A33D] hover:bg-[#ffb752] text-black rounded-lg text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Write a Review
              </Link>
            )}

            {media.externalUrl && (
              <a
                href={media.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3 bg-gray-900 hover:bg-gray-850 text-gray-300 border border-gray-800/60 rounded-lg text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <span>Watch / Listen</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Title, Description, Scene Aggregation */}
        <div className="md:col-span-3 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <CategoryBadge category={media.category} />
              
              {session && ["TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(media.category) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Reclassify:</span>
                  <select
                    value={media.category}
                    onChange={async (e) => {
                      const newCat = e.target.value;
                      try {
                        const res = await fetch(`/api/media/${media.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ category: newCat }),
                        });
                        if (res.ok) {
                          setMedia({ ...media, category: newCat });
                        }
                      } catch (err) {
                        console.error("Reclassify error:", err);
                      }
                    }}
                    className="bg-[#151821] border border-gray-800 text-xs text-[#E8A33D] rounded px-2 py-0.5 cursor-pointer focus:outline-none hover:border-[#E8A33D]/30 transition"
                  >
                    <option value="TV_SHOW">TV Show</option>
                    <option value="WEB_SERIES">Web Series</option>
                    <option value="TV_SERIAL">TV Serial</option>
                  </select>
                </div>
              )}

              <span className="text-sm text-gray-400 font-semibold font-mono">{media.year}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wider leading-tight">
              {media.title}
            </h1>
            <p className="text-lg font-medium text-[#E8A33D]">{media.creatorOrStudio}</p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Synopsis</h3>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{media.description}</p>
          </div>

          {/* SIGNATURE FEATURE: "Top Scenes" Aggregator */}
          <div className="p-6 rounded-2xl bg-[#151821] border border-gray-800/60 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-5 h-5 text-[#E8A33D]" />
                Top Scenes Aggregator
              </h3>
              <span className="text-xs text-gray-500 font-medium">Shared moments</span>
            </div>

            {aggregation.length > 0 ? (
              <div className="space-y-4">
                {aggregation.map((group, index) => {
                  const isGrouped = group.episodeLabel || group.timestampLabel;
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/50 space-y-3.5"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          {isGrouped ? (
                            <>
                              <span className="text-xs font-black text-[#E8A33D] font-mono uppercase">
                                SCENE GROUP
                              </span>
                              <div className="flex items-center gap-1.5">
                                {group.episodeLabel && (
                                  <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-700/50">
                                    <Tv className="w-3 h-3 text-gray-400" />
                                    {group.episodeLabel}
                                  </span>
                                )}
                                {group.timestampLabel && (
                                  <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-700/50">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {group.timestampLabel}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 font-mono uppercase">
                              Ungrouped Review Snippet
                            </span>
                          )}
                        </div>
                        <span className="text-xs bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
                          Cited {group.count} {group.count === 1 ? "time" : "times"}
                        </span>
                      </div>

                      {/* Content quotes from users */}
                      <div className="space-y-2 pl-2 border-l-2 border-[#E8A33D]/30">
                        {group.notes.map((note: any) => (
                          <div key={note.id} className="text-sm text-gray-300 space-y-1">
                            <p className="italic">&ldquo;{note.content}&rdquo;</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-normal">
                              <span>—</span>
                              {note.user.avatarUrl ? (
                                <img
                                  src={note.user.avatarUrl}
                                  alt={note.user.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-3.5 h-3.5 text-gray-600" />
                              )}
                              <Link
                                href={`/user/${note.user.id}`}
                                className="hover:underline hover:text-gray-300 font-medium"
                              >
                                {note.user.name}
                              </Link>
                              <span className="text-[#E8A33D] font-mono flex items-center gap-0.5 ml-1">
                                <Star className="w-3 h-3 fill-[#E8A33D]" />
                                {note.rating}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">
                No Scene Breakdown data available. Write a review to add scene details!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Reviews Feed Section */}
      <div className="space-y-6 pt-6 border-t border-gray-800/40">
        <h3 className="text-xl font-black text-white uppercase tracking-wider">
          Reviews ({reviews.length})
        </h3>

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => {
              const hasNotes = review.sceneNotes && review.sceneNotes.length > 0;
              const isLiked = session?.user
                ? review.likes?.some((l: any) => l.userId === (session.user as any).id)
                : false;

              return (
                <div
                  key={review.id}
                  className="bg-[#151821] p-6 rounded-2xl border border-gray-800/60 space-y-4 shadow-sm"
                >
                  {/* User Profile Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link href={`/user/${review.user.id}`}>
                        {review.user.avatarUrl ? (
                          <img
                            src={review.user.avatarUrl}
                            alt={review.user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link href={`/user/${review.user.id}`} className="font-bold text-sm text-gray-200 hover:text-white transition">
                          {review.user.name}
                        </Link>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {review.rewatched && (
                        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Rewatched
                        </span>
                      )}
                      <div className="flex items-center gap-1 bg-gray-900 px-3 py-1 rounded-lg border border-gray-800 text-[#E8A33D]">
                        <Star className="w-4 h-4 fill-[#E8A33D] stroke-none" />
                        <span className="text-sm font-black font-mono">{review.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.body && (
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {review.body}
                    </p>
                  )}

                  {/* Scene Notes Sub-section */}
                  {hasNotes && (
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        Scene breakdown
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {review.sceneNotes.map((note: any) => (
                          <SceneNoteCard key={note.id} note={note} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Action Footer */}
                  <div className="flex items-center gap-6 pt-3 border-t border-gray-800/40 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    <button
                      onClick={() => handleLikeToggle(review.id)}
                      className={`flex items-center gap-1.5 transition ${
                        isLiked ? "text-rose-400 hover:text-rose-500" : "hover:text-[#E8A33D]"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-400 stroke-none" : ""}`} />
                      <span>
                        {review._count?.likes ?? 0} {review._count?.likes === 1 ? "Like" : "Likes"}
                      </span>
                    </button>

                    <Link
                      href={`/review/${review.id}`}
                      className="flex items-center gap-1.5 hover:text-[#E8A33D] transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>
                        {review._count?.comments ?? 0}{" "}
                        {review._count?.comments === 1 ? "Comment" : "Comments"}
                      </span>
                    </Link>

                    <Link
                      href={`/review/${review.id}`}
                      className="flex items-center gap-0.5 hover:text-white transition ml-auto"
                    >
                      <span>Full review</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40">
            <p className="text-gray-500 text-sm">No reviews yet for this media item.</p>
            <Link
              href={session ? `/review/new?mediaId=${media.id}` : "/auth/signin"}
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#E8A33D] hover:underline"
            >
              Be the first to review &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
