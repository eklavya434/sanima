"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, Loader2, AlertCircle } from "lucide-react";

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    avatarUrl: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user) {
      const currentUserId = (session.user as any).id;
      if (id !== currentUserId) {
        router.push(`/user/${id}`);
        return;
      }

      // Load profile info from server
      const loadProfile = async () => {
        setFetching(true);
        try {
          const res = await fetch(`/api/user/${id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name: data.name || "",
              avatarUrl: data.avatarUrl || "",
              bio: data.bio || "",
            });
          }
        } catch (err) {
          console.error("Failed to load user info:", err);
        } finally {
          setFetching(false);
        }
      };

      loadProfile();
    }
  }, [status, session, id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name.trim()) {
      setError("Display Name is required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      // Hot-reload NextAuth session details
      await update({
        name: data.name,
        image: data.avatarUrl,
        bio: data.bio,
      });

      router.push(`/user/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || fetching) {
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
            <Settings className="w-6 h-6 text-[#E8A33D]" /> Edit Your Profile
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Update your public persona on Sanima. Changes reflect immediately across all reviews.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Display Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                className="dark-input w-full text-sm"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-1">
              <label htmlFor="avatarUrl" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avatar Image URL
              </label>
              <input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                value={formData.avatarUrl}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="dark-input w-full text-sm"
              />
              <p className="text-[10px] text-gray-550">
                Provide a URL link to your profile photo. Supports standard image file types.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Short Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Talk about what kind of media you like to review..."
                className="dark-input w-full resize-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-bold uppercase tracking-wider rounded-lg text-black bg-[#E8A33D] hover:bg-[#ffb752] transition focus:outline-none disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/user/${id}`)}
              className="px-6 py-3.5 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-sm font-bold uppercase tracking-wider transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
