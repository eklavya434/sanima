"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";
import { Search as SearchIcon, Film, SlidersHorizontal, Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [year, setYear] = useState(searchParams.get("year") || "");

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async (searchQuery: string, catFilter: string, yearFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (catFilter && catFilter !== "ALL") params.append("category", catFilter);
      if (yearFilter) params.append("year", yearFilter);

      const res = await fetch(`/api/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
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

    fetchResults(queryVal, catVal, yearVal);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.append("q", q.trim());
    if (category !== "ALL") params.append("category", category);
    if (year.trim()) params.append("year", year.trim());

    router.push(`/media/search?${params.toString()}`);
  };

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
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((item) => (
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
                {/* Category Badge overlay */}
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
      ) : (
        <div className="text-center py-24 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40">
          <p className="text-gray-500 text-sm">No media items found matching your filters.</p>
          <Link
            href="/media/new"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#E8A33D] hover:underline"
          >
            Add a new media item +
          </Link>
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
