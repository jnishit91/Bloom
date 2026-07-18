import { requireAdmin } from "@/lib/admin";
import { getDashboardStats, getAdminCourses } from "@/lib/admin-queries";
import type {
  RecentPayment,
  RecentSignup,
  CourseBreakdownRow,
} from "@/lib/admin-queries";
import {
  Users,
  CreditCard,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  UserPlus,
  ShoppingCart,
  AlertTriangle,
  Repeat,
  CalendarDays,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const [stats, courses] = await Promise.all([
    getDashboardStats(supabase),
    getAdminCourses(supabase),
  ]);

  const weekDelta = stats.enrollmentsThisWeek - stats.enrollmentsLastWeek;
  const weekTrend = weekDelta >= 0 ? "up" : "down";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your business at a glance
        </p>
      </div>

      {/* Revenue row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Revenue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            icon={<IndianRupee className="size-5 text-dawn-gold" />}
          />
          <StatCard
            label="Today"
            value={`₹${stats.revenueToday.toLocaleString("en-IN")}`}
            icon={<Clock className="size-5 text-sage" />}
          />
          <StatCard
            label="This Week"
            value={`₹${stats.revenueThisWeek.toLocaleString("en-IN")}`}
            icon={<CalendarDays className="size-5 text-bloom-rose" />}
          />
          <StatCard
            label="This Month"
            value={`₹${stats.revenueThisMonth.toLocaleString("en-IN")}`}
            icon={<TrendingUp className="size-5 text-sage" />}
          />
        </div>
      </div>

      {/* Users & conversions row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Users & Conversions
        </h2>
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
                {stats.enrollmentsThisWeek} this week vs{" "}
                {stats.enrollmentsLastWeek} last week
              </span>
            }
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={<ShoppingCart className="size-5 text-dawn-gold" />}
            footer={
              <span className="text-xs text-muted-foreground">
                Signups → Paid
              </span>
            }
          />
          <StatCard
            label="Avg Revenue / User"
            value={`₹${stats.avgRevenuePerUser.toLocaleString("en-IN")}`}
            icon={<IndianRupee className="size-5 text-sage" />}
          />
        </div>
      </div>

      {/* Insights row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Insights
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Multi-Course Buyers"
            value={stats.multiCourseBuyers.toLocaleString("en-IN")}
            icon={<Repeat className="size-5 text-bloom-rose" />}
            footer={
              <span className="text-xs text-muted-foreground">
                Users who bought 2+ courses
              </span>
            }
          />
          <StatCard
            label="Failed / Pending Checkouts"
            value={stats.failedCheckouts.toLocaleString("en-IN")}
            icon={<AlertTriangle className="size-5 text-dawn-gold" />}
            footer={
              <span className="text-xs text-muted-foreground">
                Started checkout but didn&apos;t pay
              </span>
            }
          />
          <StatCard
            label="Signups Without Purchase"
            value={(
              stats.totalUsers - (stats.paidEnrollments > 0 ? new Set(stats.recentPayments.map(() => "")).size : 0)
            ).toLocaleString("en-IN")}
            icon={<UserPlus className="size-5 text-muted-foreground" />}
            footer={
              <span className="text-xs text-muted-foreground">
                {stats.totalUsers - stats.paidEnrollments} registered but never
                paid
              </span>
            }
          />
        </div>
      </div>

      {/* Two-column: Recent payments + Recent signups */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent payments */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="font-heading text-sm font-semibold text-botanical">
              Recent Transactions
            </h2>
            <Link
              href="/admin/payments"
              className="text-xs text-bloom-rose hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats.recentPayments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No transactions yet
              </p>
            ) : (
              stats.recentPayments.slice(0, 5).map((p, i) => (
                <PaymentRow key={i} payment={p} />
              ))
            )}
          </div>
        </div>

        {/* Recent signups */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="font-heading text-sm font-semibold text-botanical">
              Recent Signups
            </h2>
            <Link
              href="/admin/members"
              className="text-xs text-bloom-rose hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats.recentSignups.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No signups yet
              </p>
            ) : (
              stats.recentSignups.slice(0, 5).map((s, i) => (
                <SignupRow key={i} signup={s} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Course revenue breakdown */}
      {stats.courseBreakdown.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="font-heading text-sm font-semibold text-botanical">
              Revenue by Course
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Course
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Enrollments
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.courseBreakdown.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-botanical">
                      {c.title}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {c.enrollments}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      ₹{c.revenue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-bloom-rose transition-all"
                            style={{
                              width: `${stats.totalRevenue > 0 ? (c.revenue / stats.totalRevenue) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs w-10 text-right">
                          {stats.totalRevenue > 0
                            ? Math.round((c.revenue / stats.totalRevenue) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courses table */}
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

function PaymentRow({ payment }: { payment: RecentPayment }) {
  const statusColor =
    payment.status === "active" || payment.status === "manual"
      ? "text-sage-dark"
      : payment.status === "failed"
        ? "text-destructive"
        : "text-dawn-gold-dark";

  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-botanical truncate">
          {payment.userName || payment.userEmail}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {payment.courseTitle}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-botanical">
          {payment.amount > 0
            ? `₹${payment.amount.toLocaleString("en-IN")}`
            : "Manual"}
        </p>
        <p className={`text-xs font-medium ${statusColor}`}>
          {payment.status}
          <span className="text-muted-foreground font-normal ml-1">
            ·{" "}
            {new Date(payment.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </p>
      </div>
    </div>
  );
}

function SignupRow({ signup }: { signup: RecentSignup }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-botanical truncate">
          {signup.name || "—"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{signup.email}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            signup.hasEnrolled
              ? "bg-sage/15 text-sage-dark"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {signup.hasEnrolled ? "Enrolled" : "Browsing"}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(signup.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}
