"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    instructor_name: "Bloom Facilitator",
    price_inr: 5000,
    total_weeks: 4,
    category: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.id) {
      router.push(`/admin/courses/${data.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          New Course
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                title: (e.target as HTMLInputElement).value,
              }))
            }
            placeholder="e.g. The Art of Conscious Love"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={form.subtitle}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                subtitle: (e.target as HTMLInputElement).value,
              }))
            }
            placeholder="A short tagline for the course"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor Name</Label>
          <Input
            id="instructor"
            value={form.instructor_name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                instructor_name: (e.target as HTMLInputElement).value,
              }))
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              value={form.price_inr}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  price_inr: parseInt((e.target as HTMLInputElement).value) || 0,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeks">Weeks</Label>
            <Input
              id="weeks"
              type="number"
              value={form.total_weeks}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  total_weeks:
                    parseInt((e.target as HTMLInputElement).value) || 0,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder="e.g. Relationships"
            />
          </div>
        </div>

        <Button type="submit" disabled={saving || !form.title.trim()}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Create Course
        </Button>
      </form>
    </div>
  );
}
