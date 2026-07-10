"use client";

import { Sparkles, BookOpen, HelpCircle, MessageCircle } from "lucide-react";

export function AiBar() {
  return (
    <div className="rounded-bloom-sm border border-border bg-white p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-bloom-sm">
      <div className="flex-1 relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-bloom-rose" />
        <input
          type="text"
          placeholder="Ask Bloom AI…"
          disabled
          className="w-full h-10 rounded-xl border border-border bg-ivory pl-10 pr-4 text-sm text-muted-foreground placeholder:text-muted-foreground/60 cursor-not-allowed"
        />
      </div>
      <div className="flex items-center gap-2">
        <PillButton icon={<BookOpen className="size-3.5" />} label="Summarize lesson" />
        <PillButton icon={<HelpCircle className="size-3.5" />} label="Quiz me" />
        <PillButton icon={<MessageCircle className="size-3.5" />} label="Chat" />
      </div>
    </div>
  );
}

function PillButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-ivory border border-border text-muted-foreground cursor-not-allowed hover:bg-muted transition-colors whitespace-nowrap"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
