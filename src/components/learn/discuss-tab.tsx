"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Reflection {
  id: string;
  text: string;
  isOwn: boolean;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

export function DiscussTab({ lessonId }: { lessonId: string }) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reflections?lessonId=${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setReflections(data.reflections || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  function handlePost() {
    if (!text.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("reflections").insert({
        user_id: user.id,
        lesson_id: lessonId,
        prompt: "Community reflection",
        response_text: text.trim(),
        is_public: true,
      });

      // Refetch
      const res = await fetch(`/api/reflections?lessonId=${lessonId}`);
      const data = await res.json();
      setReflections(data.reflections || []);
      setText("");
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Composer */}
      <div className="p-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">
          Share a thought about this lesson
        </p>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What resonated with you?"
            rows={2}
            className="flex-1 rounded-xl border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-rose/20 outline-none resize-none"
          />
          <Button
            size="icon"
            onClick={handlePost}
            disabled={isPending || !text.trim()}
            className="shrink-0 self-end"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Reflections list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 text-muted-foreground animate-spin" />
          </div>
        ) : reflections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <MessageSquare className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No reflections shared yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reflections.map((r) => (
              <div
                key={r.id}
                className={`px-4 py-3 ${r.isOwn ? "bg-bloom-rose/5" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-xs font-semibold text-sage-dark shrink-0">
                    {r.authorAvatar ? (
                      <img
                        src={r.authorAvatar}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      r.authorName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-medium text-botanical">
                    {r.isOwn ? "You" : r.authorName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(r.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-botanical/80 leading-relaxed pl-8">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
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
