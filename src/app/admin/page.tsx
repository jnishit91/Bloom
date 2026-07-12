import { requireAdmin } from "@/lib/admin";
import { getDashboardStats, getAdminCourses } from "@/lib/admin-queries";
import {
  Users,
  CreditCard,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const stats = await getDashboardStats(supabase);
  const courses = await getAdminCourses(supabase);

  const weekDelta = stats.enrollmentsThisWeek - stats.enrollmentsLastWeek;
  const weekTrend = weekDelta >= 0 ? "up" : "down";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Users"
          value={stats.totalUsers.toLocaleString("en-IN")}
          icon={<Users className="size-5 text-sage" />}
        />
        <StatCard
          label="Paid Enrollments"
          value={stats.paidEnrollments.toLocaleString("en-IN")}
          icon={<CreditCard className="size-5 text-bloom-rose" />}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="size-5 text-dawn-gold" />}
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="size-5 text-sage" />}
          footer={
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                weekTrend === "up" ? "text-sage-dark" : "text-bloom-rose"
              }`}
            >
              {weekTrend === "up" ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {stats.enrollmentsThisWeek} this week vs {stats.enrollmentsLastWeek} last week
            </span>
          }
        />
      </div>

      {/* Recent courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-botanical">
            Courses
          </h2>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-bloom-rose px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bloom-rose-dark"
          >
            <BookOpen className="size-4" />
            New Course
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Lessons
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Enrollments
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="font-medium text-botanical hover:text-bloom-rose transition-colors"
                      >
                        {course.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {course.total_lessons}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {course.enrollment_count}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      ₹{course.price_inr.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No courses yet.{" "}
                      <Link
                        href="/admin/courses/new"
                        className="text-bloom-rose hover:underline"
                      >
                        Create one
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-bloom-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-botanical font-heading">{value}</p>
      {footer && <div className="mt-2">{footer}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "published"
      ? "bg-sage/15 text-sage-dark"
      : "bg-dawn-gold/15 text-dawn-gold-dark";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
