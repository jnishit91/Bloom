"use client";

import { Flame } from "lucide-react";

export function StreakCounter({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-dawn-gold/10 px-4 py-2 border border-dawn-gold/20">
      <Flame
        className={`size-5 text-dawn-gold ${streak >= 3 ? "animate-bloom-pulse" : ""}`}
      />
      <span className="text-sm font-semibold text-dawn-gold-dark">
        {streak} day streak
      </span>
    </div>
  );
}
