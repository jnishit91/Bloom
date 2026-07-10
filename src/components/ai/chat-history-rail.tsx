"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, MessageSquare, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
  lesson_id: string | null;
}

interface ChatHistoryRailProps {
  activeConversationId: string | null;
  onSelect: (id: string | null) => void;
  lessonId?: string | null;
}

export function ChatHistoryRail({
  activeConversationId,
  onSelect,
  lessonId,
}: ChatHistoryRailProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("ai_conversations")
        .select("id, title, updated_at, lesson_id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (lessonId) {
        query = query.eq("lesson_id", lessonId);
      }

      const { data } = await query;
      setConversations(data || []);
      setLoading(false);
    }

    load();
  }, [lessonId]);

  return (
    <div className="border-b border-white/10 px-3 py-2">
      <button
        onClick={() => onSelect(null)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Plus className="size-3.5" />
        New chat
      </button>

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="size-3.5 animate-spin text-white/40" />
        </div>
      ) : (
        <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                activeConversationId === conv.id
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <MessageSquare className="size-3 flex-shrink-0" />
              <span className="truncate">
                {conv.title || "Untitled chat"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
