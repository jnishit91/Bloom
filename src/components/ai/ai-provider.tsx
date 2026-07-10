"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface LessonContext {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
}

interface AiState {
  drawerOpen: boolean;
  openDrawer: (mode?: "chat" | "summarize" | "quiz", initialMessage?: string) => void;
  closeDrawer: () => void;
  activeMode: "chat" | "summarize" | "quiz";
  setActiveMode: (mode: "chat" | "summarize" | "quiz") => void;
  lessonContext: LessonContext | null;
  setLessonContext: (ctx: LessonContext | null) => void;
  initialMessage: string | null;
  clearInitialMessage: () => void;
}

const AiContext = createContext<AiState | null>(null);

export function AiProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"chat" | "summarize" | "quiz">("chat");
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const openDrawer = useCallback(
    (mode: "chat" | "summarize" | "quiz" = "chat", msg?: string) => {
      setActiveMode(mode);
      if (msg) setInitialMessage(msg);
      setDrawerOpen(true);
    },
    [],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const clearInitialMessage = useCallback(() => {
    setInitialMessage(null);
  }, []);

  return (
    <AiContext.Provider
      value={{
        drawerOpen,
        openDrawer,
        closeDrawer,
        activeMode,
        setActiveMode,
        lessonContext,
        setLessonContext,
        initialMessage,
        clearInitialMessage,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAi must be used within AiProvider");
  return ctx;
}
