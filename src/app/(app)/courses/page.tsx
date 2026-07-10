import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses — Bloom",
  description: "Browse Bloom's relationship-transformation courses.",
};

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl text-botanical tracking-tight mb-2">
        Courses
      </h1>
      <p className="text-muted-foreground text-lg">
        Premium courses to transform your relationships. More coming soon.
      </p>
    </div>
  );
}
