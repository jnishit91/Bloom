"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAi } from "@/components/ai/ai-provider";

export function BloomAiButton() {
  const { openDrawer } = useAi();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => openDrawer("chat")}
      className="hidden sm:inline-flex gap-1.5 text-bloom-rose hover:text-bloom-rose-dark hover:bg-bloom-rose/10"
    >
      <Sparkles className="size-4" />
      Bloom AI
    </Button>
  );
}
