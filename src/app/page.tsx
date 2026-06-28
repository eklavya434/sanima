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

const GENRES_LIST = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Animation", "Documentary", "Thriller", "Romance"];

interface GenreRowProps {
  title: string;
  items: any[];
}

function GenreRow({ title, items }: GenreRowProps) {
  if (items.length === 0) return null;
  
  return (
    <div className="space-y-3.5">
      <h2 className="text-base font-bold uppercase tracking-wider text-gray-300 border-l-4 border-[#E8A33D] pl-3">
        {title}
      </h2>
      
      {/* Horizontally scrollable row */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/media/${item.id}`}
            className="w-32 sm:w-40 flex-shrink-0 flex flex-col bg-[#151821]/40 border border-gray-800/40 rounded-xl overflow-hidden shadow-md hover:border-[#E8A33D]/20 transition group"
          >
            <div className="aspect-[2/3] w-full relative overflow-hidden bg-gray-900 flex items-center justify-center border-b border-gray-800/40">
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <Film className="w-8 h-8 text-gray-700" />
              )}
              {item.averageRating && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-sm text-[9px] font-bold text-[#E8A33D] border border-gray-800/40 font-mono">
                  <Star className="w-2.5 h-2.5 fill-[#E8A33D] stroke-none" />
                  <span>{item.averageRating}</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <CategoryBadge category={item.category} className="text-[8px] px-1.5 py-0" />
              </div>
            </div>
            
            <div className="p-2.5 flex flex-col flex-grow justify-between min-w-0">
              <h3 className="font-bold text-xs text-gray-200 line-clamp-1 group-hover:text-white transition">
                {item.title}
              </h3>
              <div className="flex justify-between items-center mt-1 text-[9px] text-gray-500 font-mono">
                <span>{item.year}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<{ trending: any[]; genres: Record<string, any[]>; recentReviews: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/homepage");
      if (res.ok) {
        const homepageData = await res.json();
        setData(homepageData);
      }
    } catch (err) {
      console.error("Failed to load homepage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const handleLikeToggle = async (reviewId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        // Hot-reload only the recent reviews to keep updates smooth
        const res2 = await fetch("/api/homepage");
        if (res2.ok) {
          const newData = await res2.json();
          setData((prev) => (prev ? { ...prev, recentReviews: newData.recentReviews } : null));
        }
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-10">
        {/* Banner Skeleton */}
        <div className="h-64 rounded-3xl bg-[#151821]/50 border border-gray-800/40 animate-pulse flex flex-col justify-end p-8 gap-3">
          <div className="h-6 bg-gray-800 rounded w-1/4" />
          <div className="h-10 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
        
        {/* Genre Rows Skeletons */}
        {Array.from({ length: 3 }).map((_, rIndex) => (
          <div key={rIndex} className="space-y-4">
            <div className="h-5 bg-gray-850 rounded w-1/6 animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, cIndex) => (
                <div
                  key={cIndex}
                  className="w-32 sm:w-40 aspect-[2/3] bg-[#151821]/40 rounded-xl animate-pulse border border-gray-800/40 flex-shrink-0"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const featured = data.trending[0];
  const trendingList = data.trending.slice(1, 11);

  return (
    <div className="space-y-12">
      {/* 1. Hero Spotlight / Trending #1 */}
      {featured ? (
        <div className="relative p-6 sm:p-8 md:p-10 rounded-3xl overflow-hidden bg-gradient-to-r from-[#151821] to-[#0d0e12] border border-gray-800/80 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          {/* Glassmorphic Background Blur Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E8A33D]/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Poster Column */}
          <div className="w-36 sm:w-44 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden bg-gray-900 border border-gray-850 shadow-lg relative group">
            {featured.posterUrl ? (
              <img src={featured.posterUrl} alt={featured.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700">
                <Film className="w-10 h-10" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <CategoryBadge category={featured.category} />
            </div>
          </div>
          
          {/* Details Column */}
          <div className="flex-grow space-y-3.5 text-center md:text-left min-w-0 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8A33D]/10 text-[#E8A33D] text-[10px] font-black uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 fill-[#E8A33D] stroke-none" /> Featured Trending Item
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider leading-tight line-clamp-2">
              {featured.title}
            </h1>
            
            <div className="flex items-center justify-center md:justify-start gap-3.5 text-xs text-gray-400 font-semibold font-mono">
              <span>{featured.year}</span>
              <span>•</span>
              <span className="text-gray-300 font-sans">{featured.creatorOrStudio}</span>
              {featured.averageRating && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#E8A33D]">
                    <Star className="w-3.5 h-3.5 fill-[#E8A33D] stroke-none" />
                    <span>{featured.averageRating} Avg</span>
                  </span>
                </>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3 max-w-2xl font-sans">
              {featured.description || "No synopsis available."}
            </p>
            
            <div className="pt-2">
              <Link
                href={`/review/new?mediaId=${featured.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#ffb752] transition shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Review</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Hero Fallback */
        <div className="relative p-8 md:p-12 rounded-3xl overflow-hidden glass-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#E8A33D]/5 to-transparent pointer-events-none"></div>
          <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8A33D]/10 text-[#E8A33D] text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to Sanima
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wider leading-tight">
              Review <span className="text-gradient">EVERYTHING</span> you consume.
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed font-sans">
              Sanima is a Letterboxd-style review sandbox for all media: movies, TV shows, podcasts, YouTube videos, and even ads.
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
      )}

      {/* 2. Trending Now Row */}
      {trendingList.length > 0 && (
        <GenreRow title="Trending Now" items={trendingList} />
      )}

      {/* 3. Horizontal Genre Rows */}
      <div className="space-y-8">
        {GENRES_LIST.map((genre) => (
          <GenreRow key={genre} title={genre} items={data.genres[genre] || []} />
        ))}
      </div>

      {/* 4. Recent Reviews Activity */}
      <div className="space-y-6 pt-6 border-t border-gray-800/40">
        <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center justify-between border-b border-gray-800/40 pb-2">
          <span>Recent User Reviews</span>
        </h2>

        {data.recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.recentReviews.map((review) => {
              const isLiked = session?.user
                ? review.likes?.some((l: any) => l.userId === (session.user as any).id)
                : false;
              const hasNotes = review.sceneNotes && review.sceneNotes.length > 0;

              return (
                <div
                  key={review.id}
                  className="bg-[#151821] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-sm space-y-4 hover:border-gray-800 transition flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Media item card summary */}
                    <div className="flex gap-4 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
                      <Link
                        href={`/media/${review.media.id}`}
                        className="w-10 aspect-[2/3] shrink-0 rounded overflow-hidden bg-gray-900 border border-gray-850 relative flex items-center justify-center"
                      >
                        {review.media.posterUrl ? (
                          <img
                            src={review.media.posterUrl}
                            alt={review.media.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-4 h-4 text-gray-700" />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={review.media.category} className="text-[8px] px-1.5 py-0" />
                          <span className="text-[10px] text-gray-500 font-mono">{review.media.year}</span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-200 mt-1 hover:underline truncate">
                          <Link href={`/media/${review.media.id}`}>{review.media.title}</Link>
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{review.media.creatorOrStudio}</p>
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
                              <UserIcon className="w-4 h-4 text-gray-500" />
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

                      <div className="flex items-center gap-2 font-mono">
                        {review.rewatched && (
                          <span className="text-[8px] bg-gray-850 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Rewatch
                          </span>
                        )}
                        <div className="flex items-center gap-1 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-900 text-[#E8A33D]">
                          <Star className="w-3.5 h-3.5 fill-[#E8A33D] stroke-none" />
                          <span className="text-xs font-black">{review.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Review text snippet */}
                    {review.body && (
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-3 font-sans">
                        {review.body}
                      </p>
                    )}

                    {/* Scene note preview list */}
                    {hasNotes && (
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {review.sceneNotes.slice(0, 1).map((note: any) => (
                          <SceneNoteCard key={note.id} note={note} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions and Social summary */}
                  <div className="flex items-center gap-5 pt-3 border-t border-gray-850 text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-4">
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
            <p className="text-gray-550 text-sm">No reviews posted yet. Be the first to add one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
