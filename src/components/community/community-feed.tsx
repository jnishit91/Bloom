"use client";

import { MessageSquare, BookOpen } from "lucide-react";

interface Reflection {
  id: string;
  text: string;
  isOwn: boolean;
  authorName: string;
  authorAvatar: string | null;
  lessonTitle: string;
  createdAt: string;
}

export function CommunityFeed({
  reflections,
}: {
  reflections: Reflection[];
}) {
  if (reflections.length === 0) {
    return (
      <div className="rounded-bloom bg-white border border-border p-12 text-center shadow-bloom-sm">
        <MessageSquare className="size-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-display text-lg text-botanical mb-2">
          No reflections yet
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          When members share their reflections publicly from lessons, they will
          appear here. Start a course and share your first insight!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reflections.map((r) => (
        <article
          key={r.id}
          className={`rounded-bloom bg-white border border-border p-5 shadow-bloom-sm transition-all hover:shadow-bloom ${
            r.isOwn ? "ring-1 ring-bloom-rose/20" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sm font-semibold text-sage-dark shrink-0 overflow-hidden">
              {r.authorAvatar ? (
                <img
                  src={r.authorAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                r.authorName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-botanical">
                {r.isOwn ? "You" : r.authorName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="size-3" />
                <span className="truncate">{r.lessonTitle}</span>
                <span>·</span>
                <span>{formatRelativeTime(r.createdAt)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-botanical/85 leading-relaxed">
            {r.text}
          </p>
        </article>
      ))}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
