"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Film, LogOut, User as UserIcon, Menu, X } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/media/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <nav className="border-b border-gray-800/40 bg-[#0d0e12]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black tracking-wider text-[#E8A33D] hover:opacity-90 transition flex items-center gap-2">
              <Film className="w-6 h-6 text-[#E8A33D]" />
              <span className="text-gradient">SANIMA</span>
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search title or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dark-input pl-10 pr-4 py-1.5 w-64 text-sm focus:w-80"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            </form>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/media/search" className="text-sm font-medium text-gray-300 hover:text-[#E8A33D] transition">
              Explore
            </Link>

            {status === "authenticated" && session?.user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/media/new"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-[#E8A33D] text-black px-3.5 py-2 rounded hover:bg-[#ffb752] transition shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Media
                </Link>

                <Link
                  href={`/user/${(session.user as any).id}`}
                  className="flex items-center gap-2 hover:opacity-80 transition group"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="w-8 h-8 rounded-full border border-[#E8A33D]/30 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-[#E8A33D]/30">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition">
                    {session.user.name}
                  </span>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-gray-400 hover:text-red-400 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-semibold bg-gray-800 text-gray-200 border border-gray-700/60 px-4 py-2 rounded hover:bg-gray-750 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white transition p-1"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-800/40 bg-[#0d0e12] px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center relative my-2">
            <input
              type="text"
              placeholder="Search title or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark-input pl-10 pr-4 py-2 w-full text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          </form>

          <Link
            href="/media/search"
            onClick={() => setIsOpen(false)}
            className="block text-base font-medium text-gray-300 hover:text-[#E8A33D] py-2"
          >
            Explore All Media
          </Link>

          {status === "authenticated" && session?.user ? (
            <div className="pt-2 border-t border-gray-800/40 space-y-3">
              <Link
                href="/media/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full bg-[#E8A33D] text-black px-4 py-2.5 rounded font-semibold text-sm transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add New Media
              </Link>
              <Link
                href={`/user/${(session.user as any).id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 py-2"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Profile"}
                    className="w-9 h-9 rounded-full object-cover border border-[#E8A33D]/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-[#E8A33D]/30">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-gray-200">{session.user.name}</div>
                  <div className="text-xs text-gray-500">View Profile</div>
                </div>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium py-2 w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-800/40 flex items-center gap-4">
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center py-2.5 rounded text-gray-300 font-medium hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center py-2.5 rounded bg-gray-800 border border-gray-700/60 text-gray-200 font-semibold transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
