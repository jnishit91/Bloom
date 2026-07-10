"use client";

import { useEffect } from "react";
import { Sparkles, BookOpen, HelpCircle, MessageCircle } from "lucide-react";
import { useAi } from "@/components/ai/ai-provider";

interface AiBarProps {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
}

export function AiBar({
  lessonId,
  lessonTitle,
  moduleTitle,
  courseTitle,
}: AiBarProps) {
  const { openDrawer, setLessonContext } = useAi();

  // Set lesson context when this bar mounts
  useEffect(() => {
    setLessonContext({ lessonId, lessonTitle, moduleTitle, courseTitle });
    return () => setLessonContext(null);
  }, [lessonId, lessonTitle, moduleTitle, courseTitle, setLessonContext]);

  function handleChat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("ai-input") as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      openDrawer("chat", value);
      input.value = "";
    } else {
      openDrawer("chat");
    }
  }

  return (
    <div className="rounded-bloom-sm border border-border bg-white p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-bloom-sm">
      <form onSubmit={handleChat} className="flex-1 relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-bloom-rose" />
        <input
          name="ai-input"
          type="text"
          placeholder="Ask Bloom AI about this lesson…"
          className="w-full h-10 rounded-xl border border-border bg-ivory pl-10 pr-4 text-sm text-botanical placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-bloom-rose/30 focus:border-bloom-rose"
        />
      </form>
      <div className="flex items-center gap-2">
        <PillButton
          icon={<BookOpen className="size-3.5" />}
          label="Summarize lesson"
          onClick={() => openDrawer("summarize")}
        />
        <PillButton
          icon={<HelpCircle className="size-3.5" />}
          label="Quiz me"
          onClick={() => openDrawer("quiz")}
        />
        <PillButton
          icon={<MessageCircle className="size-3.5" />}
          label="Chat"
          onClick={() => openDrawer("chat")}
        />
      </div>
    </div>
  );
}

function PillButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-ivory border border-border text-botanical hover:bg-bloom-rose/10 hover:border-bloom-rose/30 hover:text-bloom-rose transition-colors whitespace-nowrap cursor-pointer"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
