"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskRow } from "@/lib/queries";
import { Check } from "lucide-react";

export function LessonTasks({
  tasks,
  lessonId,
}: {
  tasks: TaskRow[];
  lessonId: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-botanical">Getting Started</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} lessonId={lessonId} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task, lessonId }: { task: TaskRow; lessonId: string }) {
  const [completed, setCompleted] = useState(task.completed);
  const [isPending, startTransition] = useTransition();
  // lessonId used for context if needed later
  void lessonId;

  function toggleComplete() {
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (completed) {
        await supabase
          .from("task_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("lesson_task_id", task.id);
        setCompleted(false);
      } else {
        await supabase.from("task_completions").upsert(
          {
            user_id: user.id,
            lesson_task_id: task.id,
          },
          { onConflict: "user_id,lesson_task_id" }
        );
        setCompleted(true);
      }
    });
  }

  return (
    <button
      onClick={toggleComplete}
      disabled={isPending}
      className="flex items-start gap-3 w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
    >
      <div
        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          completed
            ? "bg-sage border-sage text-white"
            : "border-border group-hover:border-sage"
        }`}
      >
        {completed && <Check className="size-3.5 animate-check-pop" />}
      </div>
      <span
        className={`text-sm leading-relaxed transition-colors ${
          completed ? "text-muted-foreground line-through" : "text-botanical"
        }`}
      >
        {task.task_text}
      </span>
    </button>
  );
}
