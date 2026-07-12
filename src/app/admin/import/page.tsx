"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    id?: string;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setMarkdown((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseTitle, markdown }),
    });

    const data = await res.json();

    if (res.ok) {
      setResult({
        success: true,
        message: `Created ${data.modulesCreated} modules and ${data.lessonsCreated} lessons`,
        id: data.id,
      });
    } else {
      setResult({ success: false, message: data.error });
    }

    setImporting(false);
  };

  // Preview parsing
  const preview = parsePreview(markdown);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Import Coursework
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a structured Markdown document to create a draft course
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input side */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Course Title</Label>
            <Input
              value={courseTitle}
              onChange={(e) =>
                setCourseTitle((e.target as HTMLInputElement).value)
              }
              placeholder="e.g. The Art of Conscious Love"
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Markdown File</Label>
            <label
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-bloom-rose/50 hover:bg-muted/50"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(fakeEvent);
                }
              }}
            >
              <Upload className="size-5" />
              <span>Choose a .md file or drop it here</span>
              <input
                type="file"
                accept=".md,.markdown,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label>Or paste content directly</Label>
            <textarea
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[300px] resize-y"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={`# Week 1: Foundations of Love\n## Lesson 1: Understanding Yourself\nYour lesson description and transcript here...\n\n## Lesson 2: Patterns in Relationships\nMore content here...\n\n# Week 2: Healing Old Wounds\n## Lesson 3: Identifying Core Wounds\n...`}
            />
          </div>

          <Button
            onClick={handleImport}
            disabled={importing || !courseTitle.trim() || !markdown.trim()}
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            Import as Draft
          </Button>

          {result && (
            <div
              className={`flex items-start gap-3 rounded-xl p-4 ${
                result.success
                  ? "bg-sage/10 text-sage-dark"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">{result.message}</p>
                {result.id && (
                  <button
                    className="text-sm underline mt-1"
                    onClick={() => router.push(`/admin/courses/${result.id}`)}
                  >
                    Open course editor →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview side */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold text-botanical mb-3">
              Format Guide
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs"># Heading</code> for
                modules (weeks) and{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">## Heading</code> for
                lessons.
              </p>
              <p>
                Everything between lesson headings becomes the lesson description
                and transcript.
              </p>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading text-base font-semibold text-botanical mb-3">
                Preview
              </h3>
              <div className="space-y-3">
                {preview.map((mod, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-botanical">
                      {mod.title}
                    </p>
                    <ul className="ml-4 mt-1 space-y-0.5">
                      {mod.lessons.map((lesson, j) => (
                        <li
                          key={j}
                          className="text-sm text-muted-foreground flex items-center gap-1.5"
                        >
                          <span className="size-1.5 rounded-full bg-bloom-rose/40 shrink-0" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parsePreview(
  md: string
): { title: string; lessons: string[] }[] {
  const lines = md.split("\n");
  const modules: { title: string; lessons: string[] }[] = [];
  let current: (typeof modules)[0] | null = null;

  for (const line of lines) {
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      if (current) modules.push(current);
      current = { title: line.replace(/^# /, "").trim(), lessons: [] };
    } else if (line.startsWith("## ")) {
      if (!current) current = { title: "Module 1", lessons: [] };
      current.lessons.push(line.replace(/^## /, "").trim());
    }
  }
  if (current) modules.push(current);

  return modules;
}
