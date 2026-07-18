"use client";

import { useState } from "react";
import Link from "next/link";
import { ORIGINAL_PRICE, OFFER_PRICE } from "@/lib/offer";

interface CatalogCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  total_lessons: number;
  total_weeks: number;
  price_inr: number;
  status: string;
  category: string | null;
  instructor_name: string;
}

const TABS = [
  { key: "all", label: "For You" },
  { key: "trending", label: "Trending" },
  { key: "relationships", label: "Relationships" },
  { key: "coming-soon", label: "Coming Soon" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CourseCatalog({ courses }: { courses: CatalogCourse[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filtered = courses.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "trending") return c.status === "published";
    if (activeTab === "relationships")
      return c.category?.toLowerCase() === "relationships";
    if (activeTab === "coming-soon") return c.status === "draft";
    return true;
  });

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl text-botanical">Explore Courses</h2>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? "bg-bloom-rose text-white shadow-bloom-sm"
                : "bg-white text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CatalogCard key={course.id} course={course} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No courses in this category yet. Check back soon!
          </div>
        )}
      </div>
    </section>
  );
}

function CatalogCard({ course }: { course: CatalogCourse }) {
  const isDraft = course.status === "draft";

  return (
    <Link
      href={isDraft ? "#" : `/courses/${course.slug}`}
      className={`group rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm hover:shadow-bloom transition-all duration-200 ${
        isDraft ? "opacity-70 pointer-events-none" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {course.cover_image_url ? (
          <div
            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url(${course.cover_image_url})` }}
          />
        ) : (
          <div className="w-full h-full bg-dawn-gradient group-hover:scale-105 transition-transform duration-300" />
        )}
        {isDraft && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-botanical/80 text-white text-xs font-medium">
            Coming Soon
          </div>
        )}
      </div>
      <div className="p-5 space-y-2">
        <span className="text-xs font-medium text-sage-dark uppercase tracking-wider">
          {course.category || "Course"}
        </span>
        <h3 className="font-display text-lg text-botanical leading-snug">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.subtitle}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {course.total_weeks} weeks · {course.total_lessons} lessons
          {!isDraft && (
            <>
              {" · "}
              <span className="line-through text-muted-foreground">₹{ORIGINAL_PRICE.toLocaleString("en-IN")}</span>{" "}
              <span className="text-botanical font-semibold">₹{OFFER_PRICE.toLocaleString("en-IN")}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
