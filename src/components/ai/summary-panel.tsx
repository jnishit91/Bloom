"use client";

import { useState, useEffect, useRef } from "react";
import { useAi } from "./ai-provider";
import { BookOpen, Loader2 } from "lucide-react";

export function SummaryPanel() {
  const { lessonContext } = useAi();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function fetchSummary() {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summarize",
            lessonId: lessonContext?.lessonId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate summary");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream available");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setContent((prev) => prev + parsed.content);
              }
            } catch {
              // Skip malformed
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate summary",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [lessonContext?.lessonId]);

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Make sure Ollama is running and the model is available.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-botanical">
        <BookOpen className="size-4 text-bloom-rose" />
        Lesson Summary
      </div>

      {isLoading && !content ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="size-4 animate-spin" />
          Generating summary…
        </div>
      ) : (
        <div className="prose prose-sm max-w-none text-botanical/90 leading-relaxed">
          {content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h3
                  key={i}
                  className="font-display text-base text-botanical mt-4 mb-2 first:mt-0"
                >
                  {line.replace("## ", "")}
                </h3>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <div key={i} className="flex gap-2 ml-1">
                  <span className="text-bloom-rose mt-0.5">•</span>
                  <span>{line.replace("- ", "")}</span>
                </div>
              );
            }
            if (line.trim()) {
              return <p key={i}>{line}</p>;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
