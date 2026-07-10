"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAi } from "./ai-provider";
import { ChatMessages, type Message } from "./chat-messages";
import { ChatHistoryRail } from "./chat-history-rail";
import { SummaryPanel } from "./summary-panel";
import { QuizPanel } from "./quiz-panel";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

export function ChatDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    activeMode,
    setActiveMode,
    lessonContext,
    initialMessage,
    clearInitialMessage,
  } = useAi();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Focus input when drawer opens
  useEffect(() => {
    if (drawerOpen && activeMode === "chat") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [drawerOpen, activeMode]);

  // Handle initial message from ai-bar
  useEffect(() => {
    if (initialMessage && drawerOpen && activeMode === "chat") {
      sendMessage(initialMessage);
      clearInitialMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, drawerOpen, activeMode]);

  function handleNewChat() {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
    setIsStreaming(false);
  }

  async function handleSelectConversation(id: string | null) {
    if (!id) {
      handleNewChat();
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, messages")
      .eq("id", id)
      .single();

    if (data) {
      setConversationId(data.id);
      const msgs = (data.messages as Message[]) || [];
      setMessages(msgs);
      setStreamingContent("");
      setIsStreaming(false);
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "chat",
            message: text,
            lessonId: lessonContext?.lessonId,
            conversationId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get response");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

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
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
              if (parsed.conversationId) {
                setConversationId(parsed.conversationId);
              }
            } catch {
              // Skip
            }
          }
        }

        if (fullContent) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent },
          ]);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I couldn't process that: ${errorMsg}`,
          },
        ]);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [isStreaming, lessonContext?.lessonId, conversationId],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] flex flex-col bg-ivory shadow-bloom-lg animate-slide-in-right">
        {/* Header */}
        <div className="bg-botanical text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-bloom-rose" />
            <span className="font-display text-base">Bloom AI</span>
            {lessonContext && (
              <span className="text-xs text-white/60 truncate max-w-[200px]">
                — {lessonContext.lessonTitle}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Chat history rail */}
        {activeMode === "chat" && (
          <div className="bg-botanical">
            <ChatHistoryRail
              activeConversationId={conversationId}
              onSelect={handleSelectConversation}
              lessonId={lessonContext?.lessonId}
            />
          </div>
        )}

        {/* Mode tabs (only show in lesson context) */}
        {lessonContext && (
          <div className="flex border-b border-border bg-white flex-shrink-0">
            <ModeTab
              active={activeMode === "chat"}
              onClick={() => setActiveMode("chat")}
              icon={<MessageCircle className="size-3.5" />}
              label="Chat"
            />
            <ModeTab
              active={activeMode === "summarize"}
              onClick={() => setActiveMode("summarize")}
              icon={<BookOpen className="size-3.5" />}
              label="Summary"
            />
            <ModeTab
              active={activeMode === "quiz"}
              onClick={() => setActiveMode("quiz")}
              icon={<HelpCircle className="size-3.5" />}
              label="Quiz"
            />
          </div>
        )}

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {activeMode === "summarize" && lessonContext ? (
            <SummaryPanel />
          ) : activeMode === "quiz" && lessonContext ? (
            <QuizPanel />
          ) : (
            <div className="p-4">
              {messages.length === 0 && !isStreaming ? (
                <EmptyState hasLesson={!!lessonContext} />
              ) : (
                <ChatMessages
                  messages={messages}
                  streamingContent={streamingContent}
                  isStreaming={isStreaming}
                />
              )}
            </div>
          )}
        </div>

        {/* Input (chat mode only) */}
        {activeMode === "chat" && (
          <div className="border-t border-border bg-white px-4 py-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  lessonContext
                    ? "Ask about this lesson…"
                    : "Ask Bloom AI anything…"
                }
                disabled={isStreaming}
                className="flex-1 h-10 rounded-xl border border-border bg-ivory pl-4 pr-4 text-sm text-botanical placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-bloom-rose/30 focus:border-bloom-rose disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 rounded-xl bg-bloom-rose text-white flex items-center justify-center hover:bg-bloom-rose-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="size-4" />
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
              AI responses may not always be accurate. Verify important information.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
        active
          ? "text-botanical border-b-2 border-bloom-rose"
          : "text-muted-foreground hover:text-botanical"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ hasLesson }: { hasLesson: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-bloom-rose/10 flex items-center justify-center mb-4">
        <Sparkles className="size-6 text-bloom-rose" />
      </div>
      <h3 className="font-display text-lg text-botanical mb-1">
        {hasLesson ? "Ask about this lesson" : "Hi, I'm Bloom AI"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        {hasLesson
          ? "I can help you understand concepts, answer questions, and deepen your learning."
          : "I'm your learning companion. Ask me about your courses, relationships, or anything on your mind."}
      </p>
    </div>
  );
}
