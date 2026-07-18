import { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
  totalUsers: number;
  paidEnrollments: number;
  totalRevenue: number;
  conversionRate: number;
  enrollmentsThisWeek: number;
  enrollmentsLastWeek: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  failedCheckouts: number;
  multiCourseBuyers: number;
  avgRevenuePerUser: number;
  recentPayments: RecentPayment[];
  recentSignups: RecentSignup[];
  courseBreakdown: CourseBreakdownRow[];
}

export interface RecentPayment {
  userName: string | null;
  userEmail: string;
  courseTitle: string;
  amount: number;
  status: string;
  date: string;
}

export interface RecentSignup {
  name: string | null;
  email: string;
  date: string;
  hasEnrolled: boolean;
}

export interface CourseBreakdownRow {
  title: string;
  enrollments: number;
  revenue: number;
}

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

  const [
    { count: totalUsers },
    { count: paidEnrollments },
    { data: allPaidEnrollments },
    { count: failedCheckouts },
    { data: recentEnrollmentRows },
    { data: recentProfileRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "manual"]),
    supabase
      .from("enrollments")
      .select("user_id, course_id, amount_paid, enrolled_at, status")
      .in("status", ["active", "manual"]),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("status", ["failed", "pending"]),
    supabase
      .from("enrollments")
      .select("user_id, course_id, amount_paid, status, enrolled_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const paid = allPaidEnrollments || [];
  const totalRevenue = paid.reduce((s, e) => s + (e.amount_paid || 0), 0);
  const revenueToday = paid
    .filter((e) => e.enrolled_at && e.enrolled_at >= todayStart)
    .reduce((s, e) => s + (e.amount_paid || 0), 0);
  const revenueThisWeek = paid
    .filter((e) => e.enrolled_at && e.enrolled_at >= weekAgo)
    .reduce((s, e) => s + (e.amount_paid || 0), 0);
  const revenueThisMonth = paid
    .filter((e) => e.enrolled_at && e.enrolled_at >= monthStart)
    .reduce((s, e) => s + (e.amount_paid || 0), 0);

  const enrollmentsThisWeek = paid.filter(
    (e) => e.enrolled_at && e.enrolled_at >= weekAgo
  ).length;
  const enrollmentsLastWeek = paid.filter(
    (e) => e.enrolled_at && e.enrolled_at >= twoWeeksAgo && e.enrolled_at < weekAgo
  ).length;

  // Multi-course buyers
  const userCourseCount = new Map<string, number>();
  for (const e of paid) {
    userCourseCount.set(e.user_id, (userCourseCount.get(e.user_id) || 0) + 1);
  }
  const multiCourseBuyers = [...userCourseCount.values()].filter((c) => c > 1).length;

  const users = totalUsers || 0;
  const paidCount = paidEnrollments || 0;
  const uniquePaidUsers = userCourseCount.size;
  const avgRevenuePerUser = uniquePaidUsers > 0 ? Math.round(totalRevenue / uniquePaidUsers) : 0;

  // Get emails for recent data
  const serviceSupabase = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: authData } = await serviceSupabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users || []) emailMap.set(u.id, u.email || "");

  // Course titles
  const courseIds = [...new Set(paid.map((e) => e.course_id))];
  const { data: courses } = courseIds.length > 0
    ? await supabase.from("courses").select("id, title").in("id", courseIds)
    : { data: [] };
  const courseMap = new Map<string, string>();
  for (const c of courses || []) courseMap.set(c.id, c.title);

  // Profile names
  const { data: allProfiles } = await supabase.from("profiles").select("id, full_name");
  const nameMap = new Map<string, string | null>();
  for (const p of allProfiles || []) nameMap.set(p.id, p.full_name);

  // Recent payments
  const recentPayments: RecentPayment[] = (recentEnrollmentRows || []).map((e) => ({
    userName: nameMap.get(e.user_id) ?? null,
    userEmail: emailMap.get(e.user_id) || "",
    courseTitle: courseMap.get(e.course_id) || "Unknown",
    amount: e.amount_paid || 0,
    status: e.status,
    date: e.enrolled_at || e.created_at,
  }));

  // Recent signups
  const enrolledUserIds = new Set(paid.map((e) => e.user_id));
  const recentSignups: RecentSignup[] = (recentProfileRows || []).map((p) => ({
    name: p.full_name,
    email: emailMap.get(p.id) || "",
    date: p.created_at,
    hasEnrolled: enrolledUserIds.has(p.id),
  }));

  // Course breakdown
  const courseRevMap = new Map<string, { enrollments: number; revenue: number }>();
  for (const e of paid) {
    const existing = courseRevMap.get(e.course_id) || { enrollments: 0, revenue: 0 };
    existing.enrollments++;
    existing.revenue += e.amount_paid || 0;
    courseRevMap.set(e.course_id, existing);
  }
  const courseBreakdown: CourseBreakdownRow[] = [...courseRevMap.entries()].map(
    ([id, data]) => ({
      title: courseMap.get(id) || "Unknown",
      ...data,
    })
  ).sort((a, b) => b.revenue - a.revenue);

  return {
    totalUsers: users,
    paidEnrollments: paidCount,
    totalRevenue,
    conversionRate: users > 0 ? Math.round((paidCount / users) * 100) : 0,
    enrollmentsThisWeek,
    enrollmentsLastWeek,
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    failedCheckouts: failedCheckouts || 0,
    multiCourseBuyers,
    avgRevenuePerUser,
    recentPayments,
    recentSignups,
    courseBreakdown,
  };
}

async function getEnrollmentCountSince(
  supabase: SupabaseClient,
  daysAgo: number
): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - daysAgo);
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "manual"])
    .gte("enrolled_at", since.toISOString());
  return count || 0;
}

async function getEnrollmentCountBetween(
  supabase: SupabaseClient,
  daysAgoStart: number,
  daysAgoEnd: number
): Promise<number> {
  const start = new Date();
  start.setDate(start.getDate() - daysAgoStart);
  const end = new Date();
  end.setDate(end.getDate() - daysAgoEnd);
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "manual"])
    .gte("enrolled_at", start.toISOString())
    .lt("enrolled_at", end.toISOString());
  return count || 0;
}

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  price_inr: number;
  total_lessons: number;
  total_weeks: number;
  category: string | null;
  created_at: string;
  enrollment_count: number;
}

export async function getAdminCourses(
  supabase: SupabaseClient
): Promise<AdminCourseRow[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, status, price_inr, total_lessons, total_weeks, category, created_at")
    .order("created_at", { ascending: false });

  if (!courses) return [];

  const courseIds = courses.map((c) => c.id);
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .in("course_id", courseIds)
    .in("status", ["active", "manual"]);

  const countMap = new Map<string, number>();
  for (const e of enrollments || []) {
    countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1);
  }

  return courses.map((c) => ({
    ...c,
    enrollment_count: countMap.get(c.id) || 0,
  }));
}

export interface MemberRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  enrollments: {
    course_id: string;
    course_title: string;
    status: string;
    amount_paid: number | null;
    enrolled_at: string | null;
    note: string | null;
  }[];
}

export async function getMembers(
  supabase: SupabaseClient
): Promise<MemberRow[]> {
  // Use service role via supabase admin client to list auth users isn't possible
  // from client SDK; instead query profiles + auth metadata
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at")
    .order("created_at", { ascending: false });

  if (!profiles) return [];

  const userIds = profiles.map((p) => p.id);

  // Get enrollments for all users
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("user_id, course_id, status, amount_paid, enrolled_at, note")
    .in("user_id", userIds);

  // Get course titles
  const courseIds = [
    ...new Set((enrollments || []).map((e) => e.course_id)),
  ];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds.length > 0 ? courseIds : ["__none__"]);

  const courseMap = new Map<string, string>();
  for (const c of courses || []) {
    courseMap.set(c.id, c.title);
  }

  // Get emails from auth — we'll fetch via a join on profiles
  // Since profiles doesn't store email, we need auth.users
  // But with RLS supabase client, we can't query auth.users directly
  // Workaround: use the email from the user's id via a server function
  // For now, we'll use a separate query approach
  // Actually, we can read emails if we query enrollments with user metadata
  // Best approach: use supabase.auth.admin.listUsers() — requires service role
  // But our client uses anon key. Let's store email in a map from what we can access.

  // We'll get emails from the auth admin API using service role
  const serviceSupabase = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData } = await serviceSupabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const emailMap = new Map<string, string>();
  for (const u of authData?.users || []) {
    emailMap.set(u.id, u.email || "");
  }

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) || "",
    phone: p.phone,
    created_at: p.created_at,
    enrollments: (enrollments || [])
      .filter((e) => e.user_id === p.id)
      .map((e) => ({
        course_id: e.course_id,
        course_title: courseMap.get(e.course_id) || "Unknown",
        status: e.status,
        amount_paid: e.amount_paid,
        enrolled_at: e.enrolled_at,
        note: e.note,
      })),
  }));
}

export interface PaymentRow {
  id: string;
  user_name: string | null;
  user_email: string;
  course_title: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_paid: number | null;
  base_amount: number | null;
  gst_amount: number | null;
  status: string;
  note: string | null;
  created_at: string;
  enrolled_at: string | null;
}

export async function getPayments(
  supabase: SupabaseClient
): Promise<PaymentRow[]> {
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, user_id, course_id, razorpay_order_id, razorpay_payment_id, amount_paid, base_amount, gst_amount, status, note, created_at, enrolled_at"
    )
    .order("created_at", { ascending: false });

  if (!enrollments || enrollments.length === 0) return [];

  const userIds = [...new Set(enrollments.map((e) => e.user_id))];
  const courseIds = [...new Set(enrollments.map((e) => e.course_id))];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds),
    supabase.from("courses").select("id, title").in("id", courseIds),
  ]);

  const nameMap = new Map<string, string | null>();
  for (const p of profiles || []) nameMap.set(p.id, p.full_name);

  const courseMap = new Map<string, string>();
  for (const c of courses || []) courseMap.set(c.id, c.title);

  const serviceSupabase = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: authData } = await serviceSupabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map<string, string>();
  for (const u of authData?.users || []) emailMap.set(u.id, u.email || "");

  return enrollments.map((e) => ({
    id: e.id,
    user_name: nameMap.get(e.user_id) ?? null,
    user_email: emailMap.get(e.user_id) || "",
    course_title: courseMap.get(e.course_id) || "Unknown",
    razorpay_order_id: e.razorpay_order_id,
    razorpay_payment_id: e.razorpay_payment_id,
    amount_paid: e.amount_paid,
    base_amount: e.base_amount,
    gst_amount: e.gst_amount,
    status: e.status,
    note: e.note,
    created_at: e.created_at,
    enrolled_at: e.enrolled_at,
  }));
}

export interface CourseAnalytics {
  id: string;
  title: string;
  enrollments: number;
  revenue: number;
  completionRate: number;
  enrollmentsByWeek: { week: string; count: number }[];
}

export async function getCourseAnalytics(
  supabase: SupabaseClient
): Promise<CourseAnalytics[]> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, total_lessons")
    .order("created_at");

  if (!courses) return [];

  const results: CourseAnalytics[] = [];

  for (const course of courses) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("user_id, amount_paid, enrolled_at")
      .eq("course_id", course.id)
      .in("status", ["active", "manual"]);

    const paid = enrollments || [];
    const revenue = paid.reduce((s, e) => s + (e.amount_paid || 0), 0);

    // Completion rate: average % of lessons completed per enrolled user
    let completionRate = 0;
    if (paid.length > 0 && course.total_lessons > 0) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", course.id);
      const moduleIds = (modules || []).map((m) => m.id);

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);
        const lessonIds = (lessons || []).map((l) => l.id);

        if (lessonIds.length > 0) {
          let totalPct = 0;
          for (const enrollment of paid) {
            const { count } = await supabase
              .from("lesson_progress")
              .select("id", { count: "exact", head: true })
              .eq("user_id", enrollment.user_id)
              .in("lesson_id", lessonIds)
              .eq("completed", true);
            totalPct += ((count || 0) / lessonIds.length) * 100;
          }
          completionRate = Math.round(totalPct / paid.length);
        }
      }
    }

    // Enrollments by week (last 12 weeks)
    const weekMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const key = d.toISOString().slice(0, 10);
      weekMap.set(key, 0);
    }

    for (const e of paid) {
      if (e.enrolled_at) {
        const d = new Date(e.enrolled_at);
        // Find the nearest week bucket
        const weekKeys = [...weekMap.keys()];
        for (let i = weekKeys.length - 1; i >= 0; i--) {
          const key = weekKeys[i]!;
          if (d.toISOString().slice(0, 10) >= key) {
            weekMap.set(key, (weekMap.get(key) || 0) + 1);
            break;
          }
        }
      }
    }

    results.push({
      id: course.id,
      title: course.title,
      enrollments: paid.length,
      revenue,
      completionRate,
      enrollmentsByWeek: [...weekMap.entries()].map(([week, count]) => ({
        week,
        count,
      })),
    });
  }

  return results;
}
