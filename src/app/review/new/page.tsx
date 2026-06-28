"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";
import { Loader2 } from "lucide-react";

function NewReviewContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mediaId = searchParams.get("mediaId");

  const [media, setMedia] = useState<any | null>(null);
  const [initialReview, setInitialReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/review/new?mediaId=${mediaId}`);
      return;
    }

    const fetchMediaAndReviews = async () => {
      if (!mediaId) {
        router.push("/");
        return;
      }
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
            }
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Error loading write review page:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && mediaId) {
      fetchMediaAndReviews();
    }
  }, [status, mediaId, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!session || !media) return null;

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
