"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";
import { Loader2, Search as SearchIcon, Film, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";

function NewReviewContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mediaId = searchParams.get("mediaId");

  const [media, setMedia] = useState<any | null>(null);
  const [initialReview, setInitialReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Search states for inline search
  const [searchQuery, setSearchQuery] = useState("");
  const [localResults, setLocalResults] = useState<any[]>([]);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/review/new${mediaId ? `?mediaId=${mediaId}` : ""}`);
      return;
    }

    if (status === "authenticated") {
      if (!mediaId) {
        setLoading(false);
        setMedia(null);
        setInitialReview(null);
        return;
      }

      const fetchMediaAndReviews = async () => {
        setLoading(true);
        try {
          const [mediaRes, reviewsRes] = await Promise.all([
            fetch(`/api/media/${mediaId}`),
            fetch(`/api/reviews?mediaId=${mediaId}`),
          ]);

          if (mediaRes.ok && reviewsRes.ok) {
            const mediaData = await mediaRes.json();
            const reviewsData = await reviewsRes.json();

            setMedia(mediaData);

            // If user already wrote a review, fetch it to allow edit
            if (session?.user) {
              const currentUserId = (session.user as any).id;
              const existingReview = reviewsData.find((r: any) => r.userId === currentUserId);
              if (existingReview) {
                setInitialReview(existingReview);
              } else {
                setInitialReview(null);
              }
            }
          } else {
            router.push("/review/new");
          }
        } catch (err) {
          console.error("Error loading write review page:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchMediaAndReviews();
    }
  }, [status, mediaId, session, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/media/search-external?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setLocalResults(data.local || []);
        setTmdbResults(data.tmdb || []);
      }
    } catch (err) {
      console.error("Inline search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (externalId: string, category: string) => {
    setImportingId(externalId);
    try {
      const res = await fetch("/api/media/import-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId, category }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/review/new?mediaId=${data.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to import media item");
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("An unexpected error occurred while importing.");
    } finally {
      setImportingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!session) return null;

  // Render Inline Search UI if no mediaId is selected
  if (!mediaId || !media) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Write a Review</h1>
          <p className="text-sm text-gray-400">
            Find the movie, TV show, podcast, ad, or video you want to review.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-grow flex items-center">
            <input
              type="text"
              placeholder="Search title, creator, studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark-input pl-10 pr-4 py-3 w-full text-sm rounded-xl"
            />
            <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3.5" />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#ffb752] transition shadow-md flex items-center gap-1.5"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Searching Loader */}
        {searching && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
          </div>
        )}

        {/* Results Sections */}
        {!searching && (localResults.length > 0 || tmdbResults.length > 0) && (
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Local matches */}
            {localResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold border-l-2 border-[#E8A33D] pl-2">
                  Already on Sanima
                </h3>
                <div className="divide-y divide-gray-800 bg-[#151821]/40 border border-gray-800/40 rounded-xl overflow-hidden shadow-md">
                  {localResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/review/new?mediaId=${item.id}`)}
                      className="w-full text-left p-3.5 hover:bg-gray-800/10 transition flex items-center gap-4 group"
                    >
                      <div className="w-10 h-14 bg-gray-900 rounded overflow-hidden flex-shrink-0 relative border border-gray-800/30">
                        {item.posterUrl ? (
                          <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-[#E8A33D] transition">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-mono">{item.year}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.creatorOrStudio}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <CategoryBadge category={item.category} />
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#E8A33D] transition transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB Matches */}
            {tmdbResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold border-l-2 border-[#E8A33D] pl-2">
                  Add & Review from TMDB
                </h3>
                <div className="divide-y divide-gray-800 bg-[#151821]/40 border border-gray-800/40 rounded-xl overflow-hidden shadow-md">
                  {tmdbResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-800/5 transition"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-14 bg-gray-900 rounded overflow-hidden flex-shrink-0 relative border border-gray-800/30">
                          {item.posterUrl ? (
                            <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-200 line-clamp-1">{item.title}</h4>
                            <span className="text-[10px] text-gray-500 font-mono">{item.year}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description || "No overview available."}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gray-800 text-[#E8A33D] font-mono">
                          {item.category}
                        </span>
                        <button
                          onClick={() => handleImport(item.id, item.category)}
                          disabled={importingId !== null}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/60 text-[#E8A33D] hover:bg-[#E8A33D] hover:text-black font-bold uppercase tracking-wider text-[10px] transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {importingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Review</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state & Add manually link */}
        {!searching && searchQuery.trim() !== "" && localResults.length === 0 && tmdbResults.length === 0 && (
          <div className="text-center py-12 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40 max-w-2xl mx-auto">
            <Film className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No items found matching &quot;{searchQuery}&quot;</p>
            <div className="flex justify-center mt-4">
              <Link
                href={`/media/new?title=${encodeURIComponent(searchQuery)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#ffb752] transition shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add manually</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render original Review Form if mediaId and media loaded
  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          {initialReview ? "Edit Your Review" : "Write a Review"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Share your ratings, top moments, and scene breakdowns with the community.
        </p>
      </div>

      <ReviewForm media={media} initialReview={initialReview} />
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    }>
      <NewReviewContent />
    </Suspense>
  );
}
