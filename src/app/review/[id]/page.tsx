"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SceneNoteCard from "@/components/SceneNoteCard";
import CategoryBadge from "@/components/CategoryBadge";
import Link from "next/link";
import {
  Film,
  Star,
  MessageSquare,
  Heart,
  Calendar,
  Trash2,
  Edit,
  Loader2,
  User as UserIcon,
} from "lucide-react";

export default function ReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [review, setReview] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviewAndComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReview(data);
        setComments(data.comments || []);
        setLikeCount(data._count?.likes || 0);

        if (session?.user) {
          const currentUserId = (session.user as any).id;
          const userLiked = data.likes?.some((l: any) => l.userId === currentUserId);
          setIsLiked(userLiked);
        }
      } else {
        router.push("/404");
      }
    } catch (error) {
      console.error("Failed to load review:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReviewAndComments();
    }
  }, [id, session]);

  const handleLikeToggle = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/reviews/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteReview = async () => {
    const confirmed = confirm("Are you sure you want to delete this review? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/media/${review.mediaId}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#E8A33D]" />
      </div>
    );
  }

  if (!review) return null;

  const isOwner = session?.user && (session.user as any).id === review.userId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left 2 Columns: Review Content */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#151821] p-6 sm:p-8 rounded-2xl border border-gray-800/60 shadow-xl space-y-6">
          {/* Header metadata */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/user/${review.user.id}`}>
                {review.user.avatarUrl ? (
                  <img
                    src={review.user.avatarUrl}
                    alt={review.user.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    <UserIcon className="w-6 h-6 text-gray-550" />
                  </div>
                )}
              </Link>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Review by</span>
                <h2 className="text-base font-bold text-gray-200 hover:text-white transition">
                  <Link href={`/user/${review.user.id}`}>{review.user.name}</Link>
                </h2>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 bg-gray-900 px-3.5 py-1.5 rounded-xl border border-gray-800 text-[#E8A33D] font-mono">
                <Star className="w-4.5 h-4.5 fill-[#E8A33D] stroke-none" />
                <span className="text-base font-black">{review.rating}</span>
                <span className="text-xs text-gray-500 font-normal">/10</span>
              </div>
              {review.rewatched && (
                <span className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Rewatched
                </span>
              )}
            </div>
          </div>

          {/* Review body text */}
          {review.body ? (
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap border-t border-gray-800/40 pt-4 font-normal">
              {review.body}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic border-t border-gray-800/40 pt-4">
              This review has no written text.
            </div>
          )}

          {/* Scene notes cards */}
          {review.sceneNotes && review.sceneNotes.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-450">
                Scene breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {review.sceneNotes.map((note: any) => (
                  <SceneNoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Review actions & social state */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800/40">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${
                  isLiked
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/30"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-400 stroke-none" : ""}`} />
                <span>{likeCount} Likes</span>
              </button>
            </div>

            {/* Owner settings (edit/delete) */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/review/new?mediaId=${review.mediaId}`}
                  className="p-2 text-gray-400 hover:text-[#E8A33D] transition"
                  title="Edit Review"
                >
                  <Edit className="w-4.5 h-4.5" />
                </Link>
                <button
                  onClick={handleDeleteReview}
                  className="p-2 text-gray-400 hover:text-red-400 transition"
                  title="Delete Review"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-[#151821] p-6 sm:p-8 rounded-2xl border border-gray-800/60 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#E8A33D]" />
            Comments ({comments.length})
          </h3>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {comment.user.avatarUrl ? (
                        <img
                          src={comment.user.avatarUrl}
                          alt={comment.user.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-4.5 h-4.5 text-gray-600" />
                      )}
                      <Link
                        href={`/user/${comment.user.id}`}
                        className="text-xs font-bold text-gray-300 hover:text-white transition"
                      >
                        {comment.user.name}
                      </Link>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{comment.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-4">No comments yet. Write one below!</p>
          )}

          {/* Comment Form */}
          {session ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3 pt-4 border-t border-gray-800/40">
              <textarea
                placeholder="Share your thoughts on this review..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                rows={3}
                className="dark-input w-full text-sm placeholder-gray-600"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-5 py-2 bg-[#E8A33D] hover:bg-[#ffb752] text-black font-bold uppercase tracking-wider text-xs rounded-lg transition disabled:opacity-50"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 border-t border-gray-800/40">
              <p className="text-xs text-gray-400">
                You must be{" "}
                <Link href="/auth/signin" className="text-[#E8A33D] font-bold hover:underline">
                  signed in
                </Link>{" "}
                to post a comment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Media Mini-Card info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#151821] p-6 rounded-2xl border border-gray-800/60 shadow-xl space-y-5">
          <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Reviewed Media</h3>
          
          <Link
            href={`/media/${review.media.id}`}
            className="group flex gap-4 p-3.5 rounded-xl bg-gray-900/60 border border-gray-850 hover:border-gray-800 transition items-center"
          >
            {review.media.posterUrl ? (
              <img
                src={review.media.posterUrl}
                alt={review.media.title}
                className="w-12 h-18 object-cover rounded shadow-md"
              />
            ) : (
              <div className="w-12 h-18 bg-gray-850 rounded flex items-center justify-center border border-gray-800">
                <Film className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div className="space-y-1">
              <CategoryBadge category={review.media.category} />
              <h4 className="font-bold text-sm text-gray-250 group-hover:text-white transition leading-snug">
                {review.media.title}
              </h4>
              <p className="text-xs text-gray-500 font-mono">
                {review.media.creatorOrStudio} &bull; {review.media.year}
              </p>
            </div>
          </Link>

          <Link
            href={`/media/${review.media.id}`}
            className="w-full text-center py-2.5 bg-gray-900 hover:bg-gray-850 text-gray-300 border border-gray-800/60 rounded-lg text-xs font-bold uppercase tracking-wider transition block"
          >
            View All Reviews &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
