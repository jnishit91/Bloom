"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Globe,
  FileText,
  X,
} from "lucide-react";

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  instructor_name: string;
  instructor_bio: string | null;
  instructor_photo_url: string | null;
  cover_image_url: string | null;
  trailer_video_url: string | null;
  price_inr: number;
  outcomes: string[];
  total_lessons: number;
  total_weeks: number;
  status: string;
  category: string | null;
}

interface Module {
  id: string;
  title: string;
  sort_order: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number;
  transcript: string | null;
  sort_order: number;
  is_free_preview: boolean;
}

interface Task {
  id: string;
  lesson_id: string;
  task_text: string;
  sort_order: number;
}

interface Resource {
  id: string;
  lesson_id: string;
  title: string;
  type: string;
  file_url: string | null;
}

interface Props {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  tasks: Task[];
  resources: Resource[];
}

export function CourseEditor({
  course: initial,
  modules: initialModules,
  lessons: initialLessons,
  tasks: initialTasks,
  resources: initialResources,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [publishing, setPublishing] = useState(false);
  const [course, setCourse] = useState(initial);
  const [modules, setModules] = useState(initialModules);
  const [lessons, setLessons] = useState(initialLessons);
  const [tasks] = useState(initialTasks);
  const [resources] = useState(initialResources);
  const [expandedModule, setExpandedModule] = useState<string | null>(
    initialModules[0]?.id || null
  );
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const saveCourse = useCallback(async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          instructor_name: course.instructor_name,
          instructor_bio: course.instructor_bio,
          instructor_photo_url: course.instructor_photo_url,
          cover_image_url: course.cover_image_url,
          trailer_video_url: course.trailer_video_url,
          price_inr: course.price_inr,
          outcomes: course.outcomes,
          total_weeks: course.total_weeks,
          category: course.category,
        }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [course]);

  const togglePublish = async () => {
    setPublishing(true);
    const res = await fetch(`/api/admin/courses/${course.id}/publish`, {
      method: "POST",
    });
    const data = await res.json();
    setCourse((c) => ({ ...c, status: data.status }));
    setPublishing(false);
  };

  const addModule = async () => {
    const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Module" }),
    });
    const mod = await res.json();
    setModules((m) => [...m, mod]);
    setExpandedModule(mod.id);
  };

  const renameTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const renameModule = (moduleId: string, title: string) => {
    setModules((m) =>
      m.map((mod) => (mod.id === moduleId ? { ...mod, title } : mod))
    );
    if (renameTimers.current[moduleId]) clearTimeout(renameTimers.current[moduleId]);
    renameTimers.current[moduleId] = setTimeout(async () => {
      await fetch(`/api/admin/courses/${course.id}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: moduleId, title }),
      });
    }, 500);
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    await fetch(`/api/admin/courses/${course.id}/modules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId }),
    });
    setModules((m) => m.filter((mod) => mod.id !== moduleId));
    setLessons((l) => l.filter((les) => les.module_id !== moduleId));
  };

  const addLesson = async (moduleId: string) => {
    const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id: moduleId, title: "New Lesson" }),
    });
    const lesson = await res.json();
    setLessons((l) => [...l, { ...lesson, description: null, video_url: null, duration_minutes: 0, transcript: null, is_free_preview: false }]);
    setEditingLesson(lesson.id);
  };

  const updateLesson = async (lessonId: string, updates: Partial<Lesson>) => {
    setLessons((l) =>
      l.map((les) => (les.id === lessonId ? { ...les, ...updates } : les))
    );
  };

  const saveLesson = async (lessonId: string) => {
    setSavingLesson(true);
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const lessonTasks = tasks
      .filter((t) => t.lesson_id === lessonId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => t.task_text);

    const lessonResources = resources
      .filter((r) => r.lesson_id === lessonId)
      .map((r) => ({ title: r.title, type: r.type, file_url: r.file_url || "" }));

    await fetch(`/api/admin/courses/${course.id}/lessons`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        title: lesson.title,
        description: lesson.description,
        video_url: lesson.video_url,
        duration_minutes: lesson.duration_minutes,
        transcript: lesson.transcript,
        is_free_preview: lesson.is_free_preview,
        tasks: lessonTasks,
        resources: lessonResources,
      }),
    });
    setSavingLesson(false);
    setEditingLesson(null);
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/admin/courses/${course.id}/lessons`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    setLessons((l) => l.filter((les) => les.id !== lessonId));
  };

  const deleteCourse = async () => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
    router.push("/admin/courses");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-botanical">
              {course.title}
            </h1>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                course.status === "published"
                  ? "bg-sage/15 text-sage-dark"
                  : "bg-dawn-gold/15 text-dawn-gold-dark"
              }`}
            >
              {course.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="text-sm text-sage-dark">Saved ✓</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-destructive">Save failed</span>
          )}
          <Button variant="outline" onClick={saveCourse} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>
          <Button
            variant={course.status === "published" ? "secondary" : "gold"}
            onClick={togglePublish}
            disabled={publishing}
          >
            {publishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : course.status === "published" ? (
              <EyeOff className="size-4" />
            ) : (
              <Globe className="size-4" />
            )}
            {course.status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Course details form */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold text-botanical">
          Course Details
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={course.title}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  title: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={course.subtitle || ""}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  subtitle: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
              value={course.description || ""}
              onChange={(e) =>
                setCourse((c) => ({ ...c, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Instructor Name</Label>
            <Input
              value={course.instructor_name}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  instructor_name: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={course.category || ""}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  category: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Instructor Bio</Label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
              value={course.instructor_bio || ""}
              onChange={(e) =>
                setCourse((c) => ({ ...c, instructor_bio: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Cover Image URL</Label>
            <Input
              value={course.cover_image_url || ""}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  cover_image_url: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Trailer Video URL</Label>
            <Input
              value={course.trailer_video_url || ""}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  trailer_video_url: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              value={course.price_inr}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  price_inr:
                    parseInt((e.target as HTMLInputElement).value) || 0,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Weeks</Label>
            <Input
              type="number"
              value={course.total_weeks}
              onChange={(e) =>
                setCourse((c) => ({
                  ...c,
                  total_weeks:
                    parseInt((e.target as HTMLInputElement).value) || 0,
                }))
              }
            />
          </div>
        </div>

        {/* Outcomes */}
        <div className="space-y-2">
          <Label>Learning Outcomes</Label>
          <div className="space-y-2">
            {(course.outcomes || []).map((outcome: string, i: number) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={outcome}
                  onChange={(e) => {
                    const updated = [...(course.outcomes || [])];
                    updated[i] = (e.target as HTMLInputElement).value;
                    setCourse((c) => ({ ...c, outcomes: updated }));
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    const updated = (course.outcomes || []).filter(
                      (_: string, idx: number) => idx !== i
                    );
                    setCourse((c) => ({ ...c, outcomes: updated }));
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCourse((c) => ({
                  ...c,
                  outcomes: [...(c.outcomes || []), ""],
                }))
              }
            >
              <Plus className="size-4" />
              Add Outcome
            </Button>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-botanical">
            Curriculum
          </h2>
          <Button variant="outline" size="sm" onClick={addModule}>
            <Plus className="size-4" />
            Add Module
          </Button>
        </div>

        <div className="space-y-3">
          {modules
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((mod) => {
              const modLessons = lessons
                .filter((l) => l.module_id === mod.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              const isExpanded = expandedModule === mod.id;

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                  {/* Module header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                    <GripVertical className="size-4 text-muted-foreground/50 cursor-grab" />
                    <button
                      onClick={() =>
                        setExpandedModule(isExpanded ? null : mod.id)
                      }
                      className="p-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      className="flex-1 bg-transparent text-sm font-semibold text-botanical focus:outline-none"
                      value={mod.title}
                      onChange={(e) => renameModule(mod.id, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {modLessons.length} lesson{modLessons.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteModule(mod.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {/* Lessons */}
                  {isExpanded && (
                    <div className="divide-y divide-border">
                      {modLessons.map((lesson) => (
                        <div key={lesson.id} className="px-4 py-3">
                          {editingLesson === lesson.id ? (
                            <LessonEditForm
                              lesson={lesson}
                              tasks={tasks.filter(
                                (t) => t.lesson_id === lesson.id
                              )}
                              resources={resources.filter(
                                (r) => r.lesson_id === lesson.id
                              )}
                              onChange={(updates) =>
                                updateLesson(lesson.id, updates)
                              }
                              onSave={() => saveLesson(lesson.id)}
                              onCancel={() => setEditingLesson(null)}
                              saving={savingLesson}
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <GripVertical className="size-4 text-muted-foreground/50 cursor-grab shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-botanical truncate">
                                    {lesson.title}
                                  </span>
                                  {lesson.is_free_preview && (
                                    <span className="rounded-full bg-dawn-gold/15 px-2 py-0.5 text-[10px] font-medium text-dawn-gold-dark">
                                      free preview
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration_minutes} min
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setEditingLesson(lesson.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => deleteLesson(lesson.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addLesson(mod.id)}
                          className="text-bloom-rose"
                        >
                          <Plus className="size-4" />
                          Add Lesson
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-heading text-lg font-semibold text-destructive mb-2">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting a course removes all modules, lessons, and enrolled student
          data.
        </p>
        <Button variant="destructive" onClick={deleteCourse}>
          <Trash2 className="size-4" />
          Delete Course
        </Button>
      </div>
    </div>
  );
}

function LessonEditForm({
  lesson,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  lesson: Lesson;
  tasks: Task[];
  resources: Resource[];
  saving: boolean;
  onChange: (updates: Partial<Lesson>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={lesson.title}
            onChange={(e) =>
              onChange({ title: (e.target as HTMLInputElement).value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (min)</Label>
          <Input
            type="number"
            value={lesson.duration_minutes}
            onChange={(e) =>
              onChange({
                duration_minutes:
                  parseInt((e.target as HTMLInputElement).value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Video URL</Label>
          <Input
            value={lesson.video_url || ""}
            onChange={(e) =>
              onChange({ video_url: (e.target as HTMLInputElement).value })
            }
          />
        </div>
        <div className="space-y-2 flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer py-2">
            <input
              type="checkbox"
              className="rounded border-border accent-bloom-rose size-4"
              checked={lesson.is_free_preview}
              onChange={(e) => onChange({ is_free_preview: e.target.checked })}
            />
            <Eye className="size-4 text-muted-foreground" />
            Free Preview
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (Markdown)</Label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-y"
          value={lesson.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Transcript</Label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y font-mono text-xs"
          value={lesson.transcript || ""}
          onChange={(e) => onChange({ transcript: e.target.value })}
          placeholder="Paste the lesson transcript here (used as AI context)"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Save Lesson
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
