import { requireAdmin } from "@/lib/admin";
import { getCourseAnalytics, getDashboardStats } from "@/lib/admin-queries";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [stats, courseAnalytics] = await Promise.all([
    getDashboardStats(supabase),
    getCourseAnalytics(supabase),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Course performance and enrollment trends
        </p>
      </div>

      <AnalyticsDashboard stats={stats} courses={courseAnalytics} />
    </div>
  );
}
