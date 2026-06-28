"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";
import {
  Film,
  Star,
  Calendar,
  Settings,
  Tv,
  Heart,
  MessageSquare,
  Loader2,
  User as UserIcon,
} from "lucide-react";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [profile, setProfile] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndReviews = async () => {
    setLoading(true);
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`/api/user/${id}`),
        fetch(`/api/reviews?userId=${id}`),
      ]);

      if (profileRes.ok && reviewsRes.ok) {
        const profileData = await profileRes.json();
        const reviewsData = await reviewsRes.json();

        setProfile(profileData);
        setReviews(reviewsData);
      } else {
        router.push("/404");
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileAndReviews();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!profile) return null;

  const isSelf = session?.user && (session.user as any).id === profile.id;

  return (
    <div className="space-y-10">
      {/* 1. Profile Header Card */}
      <div className="bg-[#151821] p-6 sm:p-8 rounded-2xl border border-gray-800/60 shadow-xl relative overflow-hidden">
        {/* Background gradient blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A33D]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#E8A33D]/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-850 flex items-center justify-center border-2 border-[#E8A33D]/30 shadow-md">
                <UserIcon className="w-10 h-10 text-gray-500" />
              </div>
            )}

            <div className="space-y-2 mt-2">
              <h1 className="text-3xl font-black text-white">{profile.name}</h1>
              <p className="text-xs text-gray-500 font-mono flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3.5 h-3.5" /> Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-300 max-w-xl leading-relaxed mt-2">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Edit Profile CTA */}
          {isSelf && (
            <Link
              href={`/user/${profile.id}/edit`}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition shadow-sm"
            >
              <Settings className="w-4 h-4" /> Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* 2. Stats Dashboard Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Reviews */}
        <div className="bg-[#151821]/60 p-5 rounded-2xl border border-gray-800/40 text-center shadow-inner space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Total Reviews</span>
          <p className="text-3xl font-black text-white font-mono">{profile.stats.reviewsCount}</p>
        </div>

        {/* Average Rating Given */}
        <div className="bg-[#151821]/60 p-5 rounded-2xl border border-gray-800/40 text-center shadow-inner space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Avg Rating Given</span>
          <p className="text-3xl font-black text-[#E8A33D] font-mono">
            {profile.stats.averageRating ? profile.stats.averageRating : "-.-"}
          </p>
        </div>

        {/* Favorite Category */}
        <div className="bg-[#151821]/60 p-5 rounded-2xl border border-gray-800/40 text-center shadow-inner space-y-1 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Favorite Category</span>
          {profile.stats.favoriteCategory ? (
            <div className="mt-1">
              <CategoryBadge category={profile.stats.favoriteCategory} className="py-1 px-3 text-[9px]" />
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-500 mt-1.5 font-sans">None</p>
          )}
        </div>
      </div>

      {/* 3. User Reviews Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider">
          Review Timeline ({reviews.length})
        </h3>

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#151821] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-sm flex flex-col sm:flex-row gap-5 items-start"
              >
                {/* Media Poster Mini-Card */}
                <Link
                  href={`/media/${review.media.id}`}
                  className="w-20 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 shadow-md relative flex items-center justify-center group"
                >
                  {review.media.posterUrl ? (
                    <img
                      src={review.media.posterUrl}
                      alt={review.media.title}
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <Film className="w-6 h-6 text-gray-700" />
                  )}
                </Link>

                {/* Review info */}
                <div className="space-y-3 flex-grow">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={review.media.category} />
                        <span className="text-xs text-gray-500 font-mono">{review.media.year}</span>
                      </div>
                      <h4 className="font-bold text-base text-gray-200 mt-1 hover:underline">
                        <Link href={`/media/${review.media.id}`}>{review.media.title}</Link>
                      </h4>
                      <p className="text-xs text-gray-500">{review.media.creatorOrStudio}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {review.rewatched && (
                        <span className="text-[9px] bg-gray-850 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Rewatched
                        </span>
                      )}
                      <div className="flex items-center gap-1 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 text-[#E8A33D] font-mono">
                        <Star className="w-3.5 h-3.5 fill-[#E8A33D] stroke-none" />
                        <span className="text-xs font-black">{review.rating}</span>
                      </div>
                    </div>
                  </div>

                  {review.body && (
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                      {review.body}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider pt-2 border-t border-gray-850">
                    <span className="font-mono font-normal">
                      Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {review._count?.likes ?? 0}
                    </span>

                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {review._count?.comments ?? 0}
                    </span>

                    <Link href={`/review/${review.id}`} className="hover:text-white transition ml-auto flex items-center gap-0.5">
                      Full Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 p-8 bg-[#151821]/20 rounded-2xl border border-gray-800/40">
            <p className="text-gray-500 text-sm">This user hasn&apos;t written any reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
