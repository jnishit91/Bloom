"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, PartyPopper } from "lucide-react";

interface LessonFooterProps {
  lessonId: string;
  courseSlug: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  isCompleted: boolean;
}

export function LessonFooter({
  lessonId,
  courseSlug,
  prevLessonId,
  nextLessonId,
  isCompleted,
}: LessonFooterProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(isCompleted);
  const [celebrating, setCelebrating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleMarkComplete() {
    if (completed) return;

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );

      setCompleted(true);
      setCelebrating(true);

      // Auto-advance after celebration
      setTimeout(() => {
        setCelebrating(false);
        if (nextLessonId) {
          router.push(`/learn/${courseSlug}/${nextLessonId}`);
        }
        router.refresh();
      }, 1800);
    });
  }

  return (
    <>
      {/* Celebration overlay */}
      {celebrating && <CelebrationOverlay />}

      <div className="sticky bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Previous */}
          {prevLessonId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/learn/${courseSlug}/${prevLessonId}`)}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {/* Mark Complete */}
          <Button
            onClick={handleMarkComplete}
            disabled={completed || isPending}
            size="lg"
            className={
              completed
                ? "bg-sage hover:bg-sage text-white gap-2 cursor-default"
                : "gap-2"
            }
          >
            {completed ? (
              <>
                <Check className="size-5" />
                Completed
              </>
            ) : isPending ? (
              "Completing…"
            ) : (
              <>
                <Check className="size-5" />
                Mark As Complete
              </>
            )}
          </Button>

          {/* Next */}
          {nextLessonId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/learn/${courseSlug}/${nextLessonId}`)}
              className="gap-1"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </>
  );
}

function CelebrationOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-fade-in-up text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-bloom-rose/20 flex items-center justify-center mb-3 animate-check-pop">
          <PartyPopper className="size-10 text-bloom-rose" />
        </div>
        <p className="font-display text-2xl text-botanical">Lesson complete!</p>
        <p className="text-muted-foreground text-sm mt-1">
          Great work — keep going!
        </p>
      </div>

      {/* Floating petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-gentle"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 60}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <ellipse
              cx="10"
              cy="6"
              rx="4"
              ry="8"
              fill="#E75D7C"
              opacity={0.3 + Math.random() * 0.4}
              transform={`rotate(${Math.random() * 360} 10 10)`}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
