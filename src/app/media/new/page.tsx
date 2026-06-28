"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Category } from "@prisma/client";
import Link from "next/link";
import { Film, Plus, Loader2, AlertCircle } from "lucide-react";

function NewMediaContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    title: "",
    category: "MOVIE",
    year: new Date().getFullYear(),
    creatorOrStudio: "",
    posterUrl: "",
    description: "",
    externalUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/media/new");
    }
  }, [status, router]);

  useEffect(() => {
    const titleParam = searchParams.get("title");
    if (titleParam) {
      setFormData((prev) => ({ ...prev, title: titleParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExistingId(null);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 409) {
        setExistingId(data.id);
        throw new Error(data.error);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create media item.");
      }

      router.push(`/media/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-[#151821] p-8 rounded-2xl border border-gray-800/60 shadow-xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-[#E8A33D]" /> Add New Media Item
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Create a reviewable item. It will be instantly available for anyone on Sanima to review.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex items-start gap-2.5 flex-col">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            {existingId && (
              <Link
                href={`/media/${existingId}`}
                className="mt-2 text-xs font-bold underline uppercase text-[#E8A33D] hover:text-[#ffb752] transition"
              >
                Go to the existing media page &rarr;
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Inception"
                  className="dark-input w-full text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="dark-input w-full text-sm appearance-none cursor-pointer"
                >
                  {Object.values(Category).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Creator / Director / Studio *</label>
                <input
                  type="text"
                  name="creatorOrStudio"
                  required
                  value={formData.creatorOrStudio}
                  onChange={handleChange}
                  placeholder="e.g. Christopher Nolan"
                  className="dark-input w-full text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Release Year *</label>
                <input
                  type="number"
                  name="year"
                  required
                  min="1800"
                  max={new Date().getFullYear() + 5}
                  value={formData.year}
                  onChange={handleChange}
                  className="dark-input w-full text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Poster / Cover Image URL</label>
              <input
                type="url"
                name="posterUrl"
                value={formData.posterUrl}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg (Optional)"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">External Watch/Listen URL</label>
              <input
                type="url"
                name="externalUrl"
                value={formData.externalUrl}
                onChange={handleChange}
                placeholder="e.g. YouTube / Spotify Link (Optional)"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">Description *</label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Write a brief overview or summary of this media item..."
                className="dark-input w-full resize-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-bold uppercase tracking-wider rounded-lg text-black bg-[#E8A33D] hover:bg-[#ffb752] transition focus:outline-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : "Create Media Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewMediaPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    }>
      <NewMediaContent />
    </Suspense>
  );
}
