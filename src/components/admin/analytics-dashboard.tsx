"use client";

import { useState } from "react";
import {
  Users,
  CreditCard,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  paidEnrollments: number;
  totalRevenue: number;
  conversionRate: number;
  enrollmentsThisWeek: number;
  enrollmentsLastWeek: number;
}

interface CourseAnalytics {
  id: string;
  title: string;
  enrollments: number;
  revenue: number;
  completionRate: number;
  enrollmentsByWeek: { week: string; count: number }[];
}

export function AnalyticsDashboard({
  stats,
  courses,
}: {
  stats: DashboardStats;
  courses: CourseAnalytics[];
}) {
  const [selectedCourse, setSelectedCourse] = useState<string>(
    courses[0]?.id || ""
  );

  const activeCourse = courses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-8">
      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Total Users"
          value={stats.totalUsers.toLocaleString("en-IN")}
          icon={<Users className="size-5 text-sage" />}
        />
        <MiniStat
          label="Paid Enrollments"
          value={stats.paidEnrollments.toLocaleString("en-IN")}
          icon={<CreditCard className="size-5 text-bloom-rose" />}
        />
        <MiniStat
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="size-5 text-dawn-gold" />}
        />
        <MiniStat
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="size-5 text-sage" />}
        />
      </div>

      {/* Per-course breakdown */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Course
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Enrollments
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Avg. Completion
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCourse(c.id)}
                  className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                    selectedCourse === c.id
                      ? "bg-bloom-rose/5"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-botanical">
                    {c.title}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {c.enrollments}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    ₹{c.revenue.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sage transition-all"
                          style={{ width: `${c.completionRate}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs w-8 text-right">
                        {c.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No courses yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment timeline chart */}
      {activeCourse && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading text-base font-semibold text-botanical mb-4">
            Enrollments Over Time — {activeCourse.title}
          </h3>
          <EnrollmentChart data={activeCourse.enrollmentsByWeek} />
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-bloom-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-botanical font-heading">{value}</p>
    </div>
  );
}

function EnrollmentChart({
  data,
}: {
  data: { week: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 160;

  return (
    <div className="flex items-end gap-1.5" style={{ height: chartHeight }}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.count / maxCount) * chartHeight * 0.85, 4);
        const dateLabel = new Date(d.week).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-1 group"
          >
            {/* Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground text-center whitespace-nowrap">
              {d.count}
            </div>
            <div
              className="w-full rounded-t-md bg-bloom-rose/70 group-hover:bg-bloom-rose transition-colors"
              style={{ height: barHeight }}
            />
            <span className="text-[9px] text-muted-foreground rotate-0 truncate max-w-full text-center leading-tight">
              {dateLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
