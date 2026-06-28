"use client";

import { useEffect, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import SceneNoteCard from "@/components/SceneNoteCard";
import { Category } from "@prisma/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Film,
  Star,
  MessageSquare,
  Heart,
  TrendingUp,
  ChevronRight,
  Plus,
  Loader2,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const fetchReviews = async (category: string) => {
    setLoadingReviews(true);
    try {
      const url = category === "ALL" ? "/api/reviews" : `/api/reviews?category=${category}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchTrendingMedia = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setTrendingMedia(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to load media catalog:", error);
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    fetchReviews(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    fetchTrendingMedia();
  }, []);

  const handleLikeToggle = async (reviewId: string) => {
    if (!session) {
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        fetchReviews(activeCategory);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Hero Welcome Header Banner */}
      <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden glass-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#E8A33D]/5 to-transparent pointer-events-none"></div>
        <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8A33D]/10 text-[#E8A33D] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Introducing Sanima
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wider leading-tight">
            Review <span className="text-gradient">EVERYTHING</span> you consume.
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Letterboxd is just for movies. Sanima is a review sandbox for all media: TV shows, web series, podcasts, YouTube videos, and even ads. Group and analyze top scenes automatically.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            href="/media/search"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#ffb752] transition shadow-lg"
          >
            Explore Catalog
          </Link>
        </div>
      </div>

      {/* 2. Category Filter Chips Panel */}
      <div className="space-y-3">
        <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Filter reviews by Category</span>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none flex-wrap">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              activeCategory === "ALL"
                ? "bg-[#E8A33D] text-black border-[#E8A33D]"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white"
            }`}
          >
            All Feed
          </button>
          {Object.values(Category).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
                activeCategory === cat
                  ? "bg-[#E8A33D] text-black border-[#E8A33D]"
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:text-white"
              }`}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Recent Reviews (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center justify-between border-b border-gray-800/40 pb-2">
            <span>Recent Activity</span>
            {loadingReviews && <Loader2 className="w-4 h-4 animate-spin text-[#E8A33D]" />}
          </h2>

          {loadingReviews ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => {
                const isLiked = session?.user
                  ? review.likes?.some((l: any) => l.userId === (session.user as any).id)
                  : false;
                const hasNotes = review.sceneNotes && review.sceneNotes.length > 0;

                return (
                  <div
                    key={review.id}
                    className="bg-[#151821] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-sm space-y-4 hover:border-gray-850 transition"
                  >
                    {/* Media item card summary */}
                    <div className="flex gap-4 p-3.5 rounded-xl bg-gray-950/40 border border-gray-900">
                      <Link
                        href={`/media/${review.media.id}`}
                        className="w-12 aspect-[2/3] shrink-0 rounded overflow-hidden bg-gray-900 border border-gray-800 relative flex items-center justify-center"
                      >
                        {review.media.posterUrl ? (
                          <img
                            src={review.media.posterUrl}
                            alt={review.media.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-5 h-5 text-gray-700" />
                        )}
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={review.media.category} />
                          <span className="text-[10px] text-gray-500 font-mono">{review.media.year}</span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-250 mt-1 hover:underline">
                          <Link href={`/media/${review.media.id}`}>{review.media.title}</Link>
                        </h4>
                        <p className="text-xs text-gray-500">{review.media.creatorOrStudio}</p>
                      </div>
                    </div>

                    {/* User profile row */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <Link href={`/user/${review.user.id}`}>
                          {review.user.avatarUrl ? (
                            <img
                              src={review.user.avatarUrl}
                              alt={review.user.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-850"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-850 flex items-center justify-center border border-gray-800">
                              <UserIcon className="w-4.5 h-4.5 text-gray-500" />
                            </div>
                          )}
                        </Link>
                        <div>
                          <p className="text-xs font-bold text-gray-300 hover:text-white transition">
                            <Link href={`/user/${review.user.id}`}>{review.user.name}</Link>
                          </p>
                          <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {review.rewatched && (
                          <span className="text-[9px] bg-gray-850 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Rewatch
                          </span>
                        )}
                        <div className="flex items-center gap-1 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-900 text-[#E8A33D] font-mono">
                          <Star className="w-3.5 h-3.5 fill-[#E8A33D] stroke-none" />
                          <span className="text-xs font-black">{review.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Review text snippet */}
                    {review.body && (
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                        {review.body}
                      </p>
                    )}

                    {/* Scene note preview list */}
                    {hasNotes && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {review.sceneNotes.slice(0, 2).map((note: any) => (
                          <SceneNoteCard key={note.id} note={note} />
                        ))}
                      </div>
                    )}

                    {/* Actions and Social summary */}
                    <div className="flex items-center gap-5 pt-3 border-t border-gray-850 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <button
                        onClick={() => handleLikeToggle(review.id)}
                        className={`flex items-center gap-1 transition ${
                          isLiked ? "text-rose-400 hover:text-rose-500" : "hover:text-[#E8A33D]"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-400 stroke-none" : ""}`} />
                        <span>{review._count?.likes ?? 0} Likes</span>
                      </button>

                      <Link href={`/review/${review.id}`} className="flex items-center gap-1 hover:text-[#E8A33D] transition">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{review._count?.comments ?? 0} Comments</span>
                      </Link>

                      <Link
                        href={`/review/${review.id}`}
                        className="flex items-center gap-0.5 hover:text-white transition ml-auto"
                      >
                        <span>Full review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40">
              <p className="text-gray-500 text-sm">No reviews found in this category.</p>
            </div>
          )}
        </div>

        {/* Right Side: Trending Catalog (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wider border-b border-gray-800/40 pb-2">
            Trending Catalog
          </h2>

          {loadingTrending ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#E8A33D]" />
            </div>
          ) : trendingMedia.length > 0 ? (
            <div className="space-y-4">
              {trendingMedia.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#151821] p-4 rounded-xl border border-gray-800/60 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/media/${item.id}`}
                      className="w-10 aspect-[2/3] shrink-0 rounded bg-gray-900 border border-gray-800 relative flex items-center justify-center"
                    >
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-4 h-4 text-gray-750" />
                      )}
                    </Link>
                    <div>
                      <CategoryBadge category={item.category} className="text-[8px] px-1.5 py-0" />
                      <h4 className="font-bold text-xs text-gray-200 mt-1 hover:underline">
                        <Link href={`/media/${item.id}`}>{item.title}</Link>
                      </h4>
                      <p className="text-[10px] text-gray-500">{item.creatorOrStudio}</p>
                    </div>
                  </div>

                  <Link
                    href={`/media/${item.id}`}
                    className="p-1.5 rounded-lg bg-gray-900 border border-gray-850 hover:bg-gray-850 transition"
                    title="View Media"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#151821]/20 rounded-xl border border-gray-800/40">
              <p className="text-xs text-gray-550 italic">The catalog is currently empty.</p>
            </div>
          )}

          {/* Quick link to search */}
          <Link
            href="/media/search"
            className="w-full text-center py-3 bg-gray-900 hover:bg-gray-850 text-gray-300 border border-gray-800/60 rounded-lg text-xs font-bold uppercase tracking-wider transition block"
          >
            Explore Catalog &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
