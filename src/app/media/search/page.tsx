"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";
import { Search as SearchIcon, Film, SlidersHorizontal, Loader2, Plus, ArrowRight } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [year, setYear] = useState(searchParams.get("year") || "");

  const [localResults, setLocalResults] = useState<any[]>([]);
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const fetchResults = async (searchQuery: string, catFilter: string, yearFilter: string) => {
    if (!searchQuery.trim()) {
      setLocalResults([]);
      setTmdbResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("q", searchQuery);
      if (catFilter && catFilter !== "ALL") params.append("category", catFilter);
      if (yearFilter) params.append("year", yearFilter);

      const res = await fetch(`/api/media/search-external?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLocalResults(data.local || []);
        setTmdbResults(data.tmdb || []);
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryVal = searchParams.get("q") || "";
    const catVal = searchParams.get("category") || "ALL";
    const yearVal = searchParams.get("year") || "";

    setQ(queryVal);
    setCategory(catVal);
    setYear(yearVal);

    if (queryVal.trim()) {
      fetchResults(queryVal, catVal, yearVal);
    } else {
      setLocalResults([]);
      setTmdbResults([]);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.append("q", q.trim());
    if (category !== "ALL") params.append("category", category);
    if (year.trim()) params.append("year", year.trim());

    router.push(`/media/search?${params.toString()}`);
  };

  const handleImport = async (externalId: string, itemCategory: string) => {
    setImportingId(externalId);
    try {
      const res = await fetch("/api/media/import-external", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ externalId, category: itemCategory }),
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

  const SkeletonCard = () => (
    <div className="flex flex-col bg-[#151821]/40 border border-gray-800/40 rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="aspect-[2/3] w-full bg-gray-900" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="h-3 bg-gray-800 rounded w-1/4" />
      </div>
    </div>
  );

  const SkeletonRow = () => (
    <div className="flex bg-[#151821]/20 border border-gray-800/20 rounded-xl overflow-hidden shadow-md p-3 gap-4 animate-pulse">
      <div className="w-16 h-24 bg-gray-900 rounded flex-shrink-0" />
      <div className="flex-grow space-y-2 py-1">
        <div className="h-4 bg-gray-800 rounded w-1/3" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">Search & Browse Catalog</h1>
        <p className="text-sm text-gray-400 mt-1">
          Explore movies, TV shows, podcasts, ads, and YouTube content.
        </p>
      </div>

      {/* Search & Filter Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#151821] border border-gray-800/60 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-300">
          <SlidersHorizontal className="w-4 h-4 text-[#E8A33D]" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Query Text Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search title, studio, creator..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="dark-input pl-10 pr-4 py-2 w-full text-sm"
            />
            <SearchIcon className="w-4 h-4 text-gray-500 absolute left-3.5" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="dark-input w-full text-sm appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <input
              type="number"
              placeholder="Release Year (e.g. 2024)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="dark-input w-full text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#ffb752] transition shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Results Display */}
      {loading ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-6 bg-gray-800 rounded w-1/6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-800 rounded w-1/6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : q.trim() === "" ? (
        <div className="text-center py-20 bg-[#151821]/10 rounded-2xl border border-gray-900 p-8">
          <Film className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Type a search term above to browse local reviews and search TMDB.</p>
        </div>
      ) : (localResults.length > 0 || tmdbResults.length > 0) ? (
        <div className="space-y-10">
          {/* Local results */}
          {localResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-wider text-gray-300 border-l-4 border-[#E8A33D] pl-3">
                Already on Sanima
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {localResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/media/${item.id}`}
                    className="group flex flex-col bg-[#151821]/40 border border-gray-800/40 rounded-xl overflow-hidden shadow-md hover:border-[#E8A33D]/20 transition"
                  >
                    {/* Media Poster */}
                    <div className="aspect-[2/3] w-full relative overflow-hidden bg-gray-900 border-b border-gray-800/50 flex items-center justify-center">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <Film className="w-10 h-10 text-gray-700 group-hover:text-gray-600 transition" />
                      )}
                      <div className="absolute top-2 left-2">
                        <CategoryBadge category={item.category} />
                      </div>
                    </div>

                    {/* Media Metadata */}
                    <div className="p-3.5 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-white transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.creatorOrStudio}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 font-mono">
                        <span>{item.year}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* TMDB results */}
          {tmdbResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-wider text-gray-300 border-l-4 border-[#E8A33D] pl-3">
                Add from TMDB
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tmdbResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex bg-[#151821]/30 border border-gray-800/40 rounded-xl overflow-hidden shadow-md p-3.5 gap-4 hover:border-gray-800 transition"
                  >
                    <div className="w-16 h-24 flex-shrink-0 bg-gray-900 rounded overflow-hidden relative border border-gray-800/40">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-gray-200 line-clamp-1">{item.title}</h3>
                          <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">{item.year}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description || "No overview available."}</p>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-800/20">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800/80 text-[#E8A33D] font-mono">
                          {item.category}
                        </span>
                        <button
                          onClick={() => handleImport(item.id, item.category)}
                          disabled={importingId !== null}
                          className="px-3.5 py-1.5 rounded bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-[10px] hover:bg-[#ffb752] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
                        >
                          {importingId === item.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <span>Add & Review</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40">
          <Film className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No media items found matching your filters.</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link
              href={`/media/new?title=${encodeURIComponent(q)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E8A33D] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#ffb752] transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Manually</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
