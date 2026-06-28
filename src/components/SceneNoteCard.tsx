import { SceneNoteType } from "@prisma/client";
import { Film, Heart, Lightbulb, Sparkles, Clock, Tv } from "lucide-react";

interface SceneNoteCardProps {
  note: {
    type: SceneNoteType;
    rank?: number | null;
    episodeLabel?: string | null;
    timestampLabel?: string | null;
    content: string;
  };
}

export const TYPE_CONFIG: Record<
  SceneNoteType,
  { label: string; icon: any; iconColor: string; bgStyle: string; borderColor: string }
> = {
  TOP_SCENE: {
    label: "Top Scene",
    icon: Film,
    iconColor: "text-amber-400",
    bgStyle: "bg-amber-950/20",
    borderColor: "border-amber-500/20",
  },
  SCENE_THAT_STAYED_WITH_ME: {
    label: "Scene That Stayed With Me",
    icon: Heart,
    iconColor: "text-rose-400",
    bgStyle: "bg-rose-950/20",
    borderColor: "border-rose-500/20",
  },
  WHAT_I_LEARNT: {
    label: "Key Takeaway",
    icon: Lightbulb,
    iconColor: "text-yellow-400",
    bgStyle: "bg-yellow-950/20",
    borderColor: "border-yellow-500/20",
  },
  OTHER: {
    label: "Best Moment",
    icon: Sparkles,
    iconColor: "text-sky-400",
    bgStyle: "bg-sky-950/20",
    borderColor: "border-sky-500/20",
  },
};

export default function SceneNoteCard({ note }: SceneNoteCardProps) {
  const config = TYPE_CONFIG[note.type] || TYPE_CONFIG.OTHER;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgStyle} flex flex-col gap-2 shadow-sm transition hover:bg-opacity-30`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
          <span className="text-[11px] font-bold tracking-wider uppercase text-gray-300">
            {note.type === "TOP_SCENE" && note.rank ? `#${note.rank} ${config.label}` : config.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {note.episodeLabel && (
            <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-[10px] font-mono text-gray-300">
              <Tv className="w-3 h-3 text-gray-400" />
              {note.episodeLabel}
            </span>
          )}
          {note.timestampLabel && (
            <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-[10px] font-mono text-gray-300">
              <Clock className="w-3 h-3 text-gray-400" />
              {note.timestampLabel}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">{note.content}</p>
    </div>
  );
}
