"use client";

import { Sparkles, User } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
}

export function ChatMessages({
  messages,
  streamingContent,
  isStreaming,
}: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}

      {/* Streaming message */}
      {isStreaming && (
        <MessageBubble
          message={{ role: "assistant", content: streamingContent || "" }}
          isStreaming={!streamingContent}
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? "bg-botanical text-white" : "bg-bloom-rose/10 text-bloom-rose"
        }`}
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
      </div>

      {/* Content */}
      <div
        className={`max-w-[85%] rounded-bloom-sm px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-botanical text-white"
            : "bg-white border border-border text-botanical"
        }`}
      >
        {isStreaming && !message.content ? (
          <TypingIndicator />
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-bloom-rose/50 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-bloom-rose/50 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-bloom-rose/50 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
