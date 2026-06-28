import { Category } from "@prisma/client";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export const CATEGORY_STYLES: Record<Category, { label: string; style: string }> = {
  MOVIE: { label: "Movie", style: "bg-rose-950/50 text-rose-300 border-rose-800/50" },
  TV_SHOW: { label: "TV Show", style: "bg-purple-950/50 text-purple-300 border-purple-800/50" },
  WEB_SERIES: { label: "Web Series", style: "bg-indigo-950/50 text-indigo-300 border-indigo-800/50" },
  TV_SERIAL: { label: "TV Serial", style: "bg-cyan-950/50 text-cyan-300 border-cyan-800/50" },
  TV_AD: { label: "TV Ad", style: "bg-amber-950/50 text-amber-300 border-amber-800/50" },
  YT_AD: { label: "YouTube Ad", style: "bg-orange-950/50 text-orange-300 border-orange-800/50" },
  YT_VIDEO: { label: "YouTube Video", style: "bg-emerald-950/50 text-emerald-300 border-emerald-800/50" },
  PODCAST: { label: "Podcast", style: "bg-sky-950/50 text-sky-300 border-sky-800/50" },
  OTHER: { label: "Other", style: "bg-gray-800/80 text-gray-300 border-gray-700/80" },
};

export default function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const config = CATEGORY_STYLES[category] || { label: category, style: "bg-gray-800 text-gray-300 border-gray-700" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${config.style} ${className}`}>
      {config.label}
    </span>
  );
}
