"use client";

import { useState } from "react";
import Link from "next/link";
import type { ModuleWithLessons } from "@/lib/queries";
import { BloomProgress } from "./progress-ring";
import {
  Check,
  Clock,
  Play,
  MessageSquare,
  BookOpen,
  X,
  ChevronUp,
} from "lucide-react";
import { DiscussTab } from "./discuss-tab";

interface LessonSidebarProps {
  modules: ModuleWithLessons[];
  courseSlug: string;
  currentLessonId: string;
  totalLessons: number;
  completedLessons: number;
  lessonId: string;
}

export function LessonSidebar({
  modules,
  courseSlug,
  currentLessonId,
  totalLessons,
  completedLessons,
  lessonId,
}: LessonSidebarProps) {
  const [activeTab, setActiveTab] = useState<"lessons" | "discuss">("lessons");

  // Count completed modules
  const completedModules = modules.filter((m) =>
    m.lessons.length > 0 && m.lessons.every((l) => l.completed)
  ).length;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[380px] xl:w-[420px] border-l border-border bg-white h-full overflow-hidden">
        <SidebarContent
          modules={modules}
          courseSlug={courseSlug}
          currentLessonId={currentLessonId}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          completedModules={completedModules}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lessonId={lessonId}
        />
      </aside>

      {/* Mobile bottom sheet */}
      <MobileBottomSheet
        modules={modules}
        courseSlug={courseSlug}
        currentLessonId={currentLessonId}
        totalLessons={totalLessons}
        completedLessons={completedLessons}
        completedModules={completedModules}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lessonId={lessonId}
      />
    </>
  );
}

function MobileBottomSheet({
  modules,
  courseSlug,
  currentLessonId,
  totalLessons,
  completedLessons,
  completedModules,
  activeTab,
  onTabChange,
  lessonId,
}: {
  modules: ModuleWithLessons[];
  courseSlug: string;
  currentLessonId: string;
  totalLessons: number;
  completedLessons: number;
  completedModules: number;
  activeTab: "lessons" | "discuss";
  onTabChange: (tab: "lessons" | "discuss") => void;
  lessonId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-botanical text-white shadow-bloom-lg hover:bg-botanical-light transition-colors cursor-pointer safe-bottom"
      >
        <BookOpen className="size-4" />
        <span className="text-sm font-medium">
          {completedLessons}/{totalLessons} lessons
        </span>
        <ChevronUp className="size-4" />
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-bloom-lg overflow-hidden flex flex-col animate-fade-in-up">
            {/* Handle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-botanical">
                Course Content
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                modules={modules}
                courseSlug={courseSlug}
                currentLessonId={currentLessonId}
                totalLessons={totalLessons}
                completedLessons={completedLessons}
                completedModules={completedModules}
                activeTab={activeTab}
                onTabChange={onTabChange}
                onLessonClick={() => setOpen(false)}
                lessonId={lessonId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  modules,
  courseSlug,
  currentLessonId,
  totalLessons,
  completedLessons,
  completedModules,
  activeTab,
  onTabChange,
  onLessonClick,
  lessonId,
}: {
  modules: ModuleWithLessons[];
  courseSlug: string;
  currentLessonId: string;
  totalLessons: number;
  completedLessons: number;
  completedModules: number;
  activeTab: "lessons" | "discuss";
  onTabChange: (tab: "lessons" | "discuss") => void;
  onLessonClick?: () => void;
  lessonId: string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => onTabChange("lessons")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "lessons"
              ? "text-botanical border-b-2 border-bloom-rose"
              : "text-muted-foreground hover:text-botanical"
          }`}
        >
          <BookOpen className="size-4 inline mr-1.5 -mt-0.5" />
          Lessons
        </button>
        <button
          onClick={() => onTabChange("discuss")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "discuss"
              ? "text-botanical border-b-2 border-bloom-rose"
              : "text-muted-foreground hover:text-botanical"
          }`}
        >
          <MessageSquare className="size-4 inline mr-1.5 -mt-0.5" />
          Discuss
        </button>
      </div>

      {activeTab === "lessons" ? (
        <div className="flex-1 overflow-y-auto">
          {/* Progress header */}
          <div className="px-4 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-botanical">
                {completedLessons} / {totalLessons} lessons completed
              </p>
              <div className="mt-2 h-1.5 w-48 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-bloom-rose transition-all duration-500"
                  style={{
                    width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <BloomProgress
              completedModules={completedModules}
              totalModules={modules.length}
              size={52}
            />
          </div>

          {/* Module list */}
          <div className="divide-y divide-border">
            {modules.map((mod) => {
              const modCompleted = mod.lessons.filter((l) => l.completed).length;
              const modTotal = mod.lessons.length;

              return (
                <div key={mod.id}>
                  {/* Module header */}
                  <div className="px-4 py-3 bg-ivory-warm/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {mod.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {modCompleted}/{modTotal}
                      </span>
                    </div>
                    {/* Per-module linear progress */}
                    <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sage transition-all duration-500"
                        style={{
                          width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Lesson rows */}
                  {mod.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        onClick={onLessonClick}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                          isCurrent ? "bg-bloom-rose/5 border-l-2 border-bloom-rose" : ""
                        }`}
                      >
                        {/* Status icon */}
                        <div className="flex-shrink-0">
                          {lesson.completed ? (
                            <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center">
                              <Check className="size-3.5 text-white" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-7 h-7 rounded-full bg-bloom-rose flex items-center justify-center">
                              <Play className="size-3 text-white ml-0.5" fill="white" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-border" />
                          )}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug truncate ${
                              isCurrent
                                ? "text-botanical font-medium"
                                : lesson.completed
                                  ? "text-muted-foreground"
                                  : "text-botanical"
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration_minutes} min
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DiscussTab lessonId={lessonId} />
      )}
    </div>
  );
}
