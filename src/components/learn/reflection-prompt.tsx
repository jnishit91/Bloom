"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export function ReflectionPrompt({ lessonId }: { lessonId: string }) {
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
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
        prompt: "What resonated with you from this lesson?",
        response_text: text.trim(),
        is_public: isPublic,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PenLine className="size-5 text-dawn-gold" />
        <h3 className="font-display text-lg text-botanical">Reflect</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        What resonated with you from this lesson? Take a moment to write it down.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reflection here…"
        rows={4}
        className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-bloom-rose focus:ring-3 focus:ring-bloom-rose/20 outline-none resize-none transition-all"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-border text-bloom-rose focus:ring-bloom-rose"
          />
          Share with community
        </label>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-sm text-sage-dark animate-fade-in-up">
              Saved ✓
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            disabled={isPending || !text.trim()}
          >
            {isPending ? "Saving…" : "Save reflection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
