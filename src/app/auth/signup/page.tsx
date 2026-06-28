"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Film, Loader2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatarUrl: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill out name, email, and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      router.push("/auth/signin?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#151821] p-8 rounded-2xl border border-gray-800/60 shadow-xl">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-2 text-[#E8A33D] hover:opacity-90 transition">
            <Film className="w-8 h-8" />
            <span className="text-2xl font-black tracking-wider text-gradient">SANIMA</span>
          </Link>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-1.5 text-center text-sm text-gray-400">
            Or{" "}
            <Link href="/auth/signin" className="font-semibold text-[#E8A33D] hover:text-[#ffb752] transition">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john@example.com"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Must be at least 6 characters"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="avatarUrl" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avatar Image URL <span className="text-gray-500">(Optional)</span>
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
            </div>

            <div className="space-y-1">
              <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Short Bio <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about your taste in media..."
                className="dark-input w-full resize-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold uppercase tracking-wider rounded-lg text-black bg-[#E8A33D] hover:bg-[#ffb752] transition focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
