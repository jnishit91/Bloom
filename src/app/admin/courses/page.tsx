import { requireAdmin } from "@/lib/admin";
import { getAdminCourses } from "@/lib/admin-queries";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();
  const courses = await getAdminCourses(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-botanical">
            Courses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your course catalog
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-bloom-rose px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bloom-rose-dark"
        >
          <Plus className="size-4" />
          New Course
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/admin/courses/${course.id}`}
            className="group rounded-2xl border border-border bg-card p-5 shadow-bloom-sm transition-all hover:shadow-bloom hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-xl bg-bloom-rose/10 p-2.5">
                <BookOpen className="size-5 text-bloom-rose" />
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  course.status === "published"
                    ? "bg-sage/15 text-sage-dark"
                    : "bg-dawn-gold/15 text-dawn-gold-dark"
                }`}
              >
                {course.status}
              </span>
            </div>
            <h3 className="font-heading font-semibold text-botanical group-hover:text-bloom-rose transition-colors">
              {course.title}
            </h3>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{course.total_lessons} lessons</span>
              <span>{course.total_weeks} weeks</span>
              <span>{course.enrollment_count} enrolled</span>
            </div>
            <p className="mt-1 text-sm font-medium text-botanical">
              ₹{course.price_inr.toLocaleString("en-IN")}
            </p>
          </Link>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto size-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No courses yet</p>
            <Link
              href="/admin/courses/new"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-bloom-rose hover:underline"
            >
              <Plus className="size-4" />
              Create your first course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
