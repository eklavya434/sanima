"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Category, SceneNoteType } from "@prisma/client";
import { Sparkles, Heart, Lightbulb, Film, Clock, Tv, Save, Loader2, AlertCircle } from "lucide-react";

// Form Schema
const schema = z.object({
  rating: z.coerce.number().min(1, "Rating must be at least 1").max(10, "Rating cannot exceed 10"),
  body: z.string().optional().or(z.literal("")),
  rewatched: z.boolean().default(false),
  
  // Movie / TV Show breakdown fields
  topScenes: z.array(z.object({
    content: z.string().optional().or(z.literal("")),
    timestampLabel: z.string().optional().or(z.literal("")),
    episodeLabel: z.string().optional().or(z.literal("")),
  })).max(5),
  sceneThatStayedWithMe: z.string().optional().or(z.literal("")),
  whatILearnt: z.string().optional().or(z.literal("")),

  // Ad fields
  bestMoment: z.string().optional().or(z.literal("")),

  // Video / Podcast fields
  keyTakeaway: z.string().optional().or(z.literal("")),
  keyTakeawayTimestamp: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface ReviewFormProps {
  media: {
    id: string;
    title: string;
    category: Category;
    year: number;
    creatorOrStudio: string;
    posterUrl?: string | null;
  };
  initialReview?: {
    id: string;
    rating: number;
    body?: string | null;
    rewatched: boolean;
    sceneNotes: Array<{
      type: SceneNoteType;
      rank?: number | null;
      episodeLabel?: string | null;
      timestampLabel?: string | null;
      content: string;
    }>;
  };
}

export default function ReviewForm({ media, initialReview }: ReviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLongForm = ["MOVIE", "TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(media.category);
  const isAd = ["TV_AD", "YT_AD"].includes(media.category);
  const isVideoPod = ["YT_VIDEO", "PODCAST"].includes(media.category);

  // Set default form values
  const defaultValues: Partial<FormData> = {
    rating: initialReview?.rating ?? 5.0,
    body: initialReview?.body ?? "",
    rewatched: initialReview?.rewatched ?? false,
    topScenes: Array.from({ length: 5 }, (_, i) => {
      const existing = initialReview?.sceneNotes.find(n => n.type === "TOP_SCENE" && n.rank === i + 1);
      return {
        content: existing?.content ?? "",
        timestampLabel: existing?.timestampLabel ?? "",
        episodeLabel: existing?.episodeLabel ?? "",
      };
    }),
    sceneThatStayedWithMe: initialReview?.sceneNotes.find(n => n.type === "SCENE_THAT_STAYED_WITH_ME")?.content ?? "",
    whatILearnt: initialReview?.sceneNotes.find(n => n.type === "WHAT_I_LEARNT" && n.rank === null)?.content ?? "",
    bestMoment: initialReview?.sceneNotes.find(n => n.type === "OTHER")?.content ?? "",
    keyTakeaway: initialReview?.sceneNotes.find(n => n.type === "WHAT_I_LEARNT" && n.timestampLabel !== undefined)?.content ?? "",
    keyTakeawayTimestamp: initialReview?.sceneNotes.find(n => n.type === "WHAT_I_LEARNT" && n.timestampLabel !== undefined)?.timestampLabel ?? "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const { fields } = useFieldArray({
    control,
    name: "topScenes",
  });

  const ratingValue = watch("rating");
  const bodyText = watch("body") || "";

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    // Structure SceneNotes depending on the media category
    const sceneNotes: Array<{
      type: SceneNoteType;
      rank?: number | null;
      episodeLabel?: string | null;
      timestampLabel?: string | null;
      content: string;
    }> = [];

    if (isLongForm) {
      // 1. Top Scenes
      data.topScenes.forEach((scene, index) => {
        if (scene.content && scene.content.trim()) {
          sceneNotes.push({
            type: "TOP_SCENE",
            rank: index + 1,
            episodeLabel: scene.episodeLabel?.trim() || null,
            timestampLabel: scene.timestampLabel?.trim() || null,
            content: scene.content.trim(),
          });
        }
      });

      // 2. Scene that stayed with me
      if (data.sceneThatStayedWithMe && data.sceneThatStayedWithMe.trim()) {
        sceneNotes.push({
          type: "SCENE_THAT_STAYED_WITH_ME",
          content: data.sceneThatStayedWithMe.trim(),
        });
      }

      // 3. What I Learnt
      if (data.whatILearnt && data.whatILearnt.trim()) {
        sceneNotes.push({
          type: "WHAT_I_LEARNT",
          content: data.whatILearnt.trim(),
        });
      }
    } else if (isAd) {
      if (data.bestMoment && data.bestMoment.trim()) {
        sceneNotes.push({
          type: "OTHER",
          content: data.bestMoment.trim(),
        });
      }
    } else if (isVideoPod) {
      if (data.keyTakeaway && data.keyTakeaway.trim()) {
        sceneNotes.push({
          type: "WHAT_I_LEARNT",
          timestampLabel: data.keyTakeawayTimestamp?.trim() || null,
          content: data.keyTakeaway.trim(),
        });
      }
    }

    const payload = {
      mediaId: media.id,
      rating: parseFloat(data.rating.toString()),
      body: data.body?.trim() || null,
      rewatched: data.rewatched,
      sceneNotes,
    };

    try {
      const url = initialReview ? `/api/reviews/${initialReview.id}` : "/api/reviews";
      const method = initialReview ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit review");
      }

      router.push(initialReview ? `/review/${initialReview.id}` : `/media/${media.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="flex gap-4 p-4 rounded-lg bg-gray-900/60 border border-gray-800/40">
        {media.posterUrl ? (
          <img
            src={media.posterUrl}
            alt={media.title}
            className="w-16 h-24 object-cover rounded shadow-md border border-gray-800"
          />
        ) : (
          <div className="w-16 h-24 bg-gray-800 rounded flex items-center justify-center border border-gray-700/60">
            <Film className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <div>
          <span className="text-[10px] bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/20 px-2 py-0.5 rounded font-bold uppercase">
            {media.category}
          </span>
          <h2 className="text-xl font-bold mt-1 text-white">{media.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {media.creatorOrStudio} &bull; {media.year}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Review Fields */}
      <div className="space-y-6">
        {/* Rating Slider & Readout */}
        <div className="bg-[#151821] p-5 rounded-lg border border-gray-800/60">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-semibold uppercase tracking-wider text-gray-300">
              Your Rating
            </label>
            <span className="text-2xl font-black text-[#E8A33D] font-mono">
              {parseFloat(ratingValue?.toString() || "0").toFixed(1)} <span className="text-sm text-gray-500 font-normal">/ 10</span>
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.5"
            {...register("rating")}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#E8A33D]"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1.5 px-0.5">
            <span>1.0</span>
            <span>2.5</span>
            <span>5.0</span>
            <span>7.5</span>
            <span>10.0</span>
          </div>
          {errors.rating && <p className="text-red-400 text-xs mt-1">{String(errors.rating.message || "")}</p>}
        </div>

        {/* Rewatched */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="rewatched"
            {...register("rewatched")}
            className="w-4.5 h-4.5 rounded border-gray-800 bg-[#151821] text-[#E8A33D] focus:ring-[#E8A33D] focus:ring-offset-0 focus:ring-2 cursor-pointer"
          />
          <label htmlFor="rewatched" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
            I&apos;ve watched/listened to this before (Rewatched)
          </label>
        </div>

        {/* Review Body */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold uppercase tracking-wider text-gray-300">
              Review Review Notes
            </label>
            {isAd && (
              <span className={`text-xs font-mono ${bodyText.length > 300 ? "text-red-400" : "text-gray-500"}`}>
                {bodyText.length}/300 suggested
              </span>
            )}
          </div>
          <textarea
            {...register("body")}
            rows={5}
            placeholder="Write your thoughts, reviews, or reflections..."
            className="dark-input w-full resize-y placeholder-gray-600 text-sm"
          />
          {errors.body && <p className="text-red-400 text-xs mt-1">{String(errors.body.message || "")}</p>}
        </div>
      </div>

      {/* CONDITIONAL SUB-SECTIONS */}

      {/* 1. MOVIE / TV_SHOW / WEB_SERIES / TV_SERIAL: Scene Breakdown */}
      {isLongForm && (
        <div className="space-y-8 border-t border-gray-800/40 pt-8">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-[#E8A33D]" />
              Scene Breakdown <span className="text-xs text-gray-500 font-normal font-sans">(Optional)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add favorite moments, takeaways, and top scenes to create the aggregated top scene view.
            </p>
          </div>

          {/* Top 5 Scenes */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Top 5 Scenes</h4>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg bg-[#151821] border border-gray-800/60 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E8A33D] font-mono">SCENE #{index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Episode Label (Only for TV Shows / Serials / Web Series) */}
                    {["TV_SHOW", "WEB_SERIES", "TV_SERIAL"].includes(media.category) && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-400 font-semibold uppercase flex items-center gap-1">
                          <Tv className="w-3 h-3" /> Episode Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. S2E4"
                          {...register(`topScenes.${index}.episodeLabel` as const)}
                          className="dark-input w-full py-1 text-xs"
                        />
                      </div>
                    )}

                    {/* Timestamp Label */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-400 font-semibold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Timestamp
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1:42:10"
                        {...register(`topScenes.${index}.timestampLabel` as const)}
                        className="dark-input w-full py-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Scene Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-semibold uppercase">Description</label>
                    <input
                      type="text"
                      placeholder="Describe what happened in this scene..."
                      {...register(`topScenes.${index}.content` as const)}
                      className="dark-input w-full py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene that stayed with me */}
          <div className="bg-[#151821] p-5 rounded-lg border border-gray-800/60 space-y-2">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              The Scene That Stayed With Me
            </label>
            <p className="text-xs text-gray-500">
              Is there a single moment, shot, or line of dialogue that you can&apos;t shake off?
            </p>
            <textarea
              {...register("sceneThatStayedWithMe")}
              rows={2}
              placeholder="Describe the scene..."
              className="dark-input w-full mt-2 text-sm"
            />
          </div>

          {/* What I Learnt */}
          <div className="bg-[#151821] p-5 rounded-lg border border-gray-800/60 space-y-2">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              What I Learnt
            </label>
            <p className="text-xs text-gray-500">
              Any philosophical takeaway, production insight, or life lesson from this media?
            </p>
            <textarea
              {...register("whatILearnt")}
              rows={2}
              placeholder="Write your learnings here..."
              className="dark-input w-full mt-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* 2. TV_AD / YT_AD: Short Form Best Moment */}
      {isAd && (
        <div className="space-y-6 border-t border-gray-800/40 pt-8">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Ad Highlights <span className="text-xs text-gray-500 font-normal font-sans">(Optional)</span>
            </h3>
          </div>

          <div className="bg-[#151821] p-5 rounded-lg border border-gray-800/60 space-y-2">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              Best Moment in the Ad
            </label>
            <p className="text-xs text-gray-500">
              What was the hook, the joke, or the visual punchline that made this ad stand out?
            </p>
            <input
              type="text"
              {...register("bestMoment")}
              placeholder="e.g. The dog grabbing the beer bottle..."
              className="dark-input w-full mt-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* 3. YT_VIDEO / PODCAST: Key Takeaways */}
      {isVideoPod && (
        <div className="space-y-6 border-t border-gray-800/40 pt-8">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Key Takeaway <span className="text-xs text-gray-500 font-normal font-sans">(Optional)</span>
            </h3>
          </div>

          <div className="bg-[#151821] p-5 rounded-lg border border-gray-800/60 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                What was the main takeaway?
              </label>
              <textarea
                {...register("keyTakeaway")}
                rows={3}
                placeholder="What did you learn or take away from this video or podcast episode?"
                className="dark-input w-full text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Timestamp of the Takeaway
              </label>
              <input
                type="text"
                placeholder="e.g. 14:20"
                {...register("keyTakeawayTimestamp")}
                className="dark-input w-full text-sm"
              />
              <p className="text-[11px] text-gray-500">
                (Optional) Point other users to the exact moment this takeaway happened.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#E8A33D] text-black font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-[#ffb752] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Review
          </>
        )}
      </button>
    </form>
  );
}
