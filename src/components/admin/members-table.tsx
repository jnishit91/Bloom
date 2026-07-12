"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Download,
  UserPlus,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface MemberEnrollment {
  course_id: string;
  course_title: string;
  status: string;
  amount_paid: number | null;
  enrolled_at: string | null;
  note: string | null;
}

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  enrollments: MemberEnrollment[];
}

interface Course {
  id: string;
  title: string;
}

type FilterStatus = "all" | "paid" | "attempted" | "never";

export function MembersTable({
  members,
  courses,
}: {
  members: Member[];
  courses: Course[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [grantModal, setGrantModal] = useState<Member | null>(null);
  const [grantCourseId, setGrantCourseId] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [granting, setGranting] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = members;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          (m.full_name || "").toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone || "").includes(q)
      );
    }

    if (filter !== "all") {
      result = result.filter((m) => {
        const hasPaid = m.enrollments.some((e) =>
          ["active", "manual"].includes(e.status)
        );
        const hasAttempted = m.enrollments.some((e) =>
          ["pending", "failed"].includes(e.status)
        );

        if (filter === "paid") return hasPaid;
        if (filter === "attempted") return !hasPaid && hasAttempted;
        if (filter === "never") return m.enrollments.length === 0;
        return true;
      });
    }

    return result;
  }, [members, search, filter]);

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Phone", "Signup Date", "Enrollment Status", "Courses Enrolled"],
    ];
    for (const m of filtered) {
      const paidCourses = m.enrollments
        .filter((e) => ["active", "manual"].includes(e.status))
        .map((e) => e.course_title)
        .join("; ");
      const status =
        m.enrollments.some((e) => ["active", "manual"].includes(e.status))
          ? "Paid"
          : m.enrollments.some((e) => ["pending", "failed"].includes(e.status))
            ? "Started checkout"
            : "Never attempted";
      rows.push([
        m.full_name || "",
        m.email,
        m.phone || "",
        new Date(m.created_at).toLocaleDateString("en-IN"),
        status,
        paidCourses,
      ]);
    }

    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloom-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGrant = async () => {
    if (!grantModal || !grantCourseId) return;
    setGranting(true);
    await fetch("/api/admin/members/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: grantModal.id,
        courseId: grantCourseId,
        note: grantNote,
      }),
    });
    setGranting(false);
    setGrantModal(null);
    setGrantCourseId("");
    setGrantNote("");
    router.refresh();
  };

  function enrollmentBadge(member: Member) {
    const hasPaid = member.enrollments.some((e) =>
      ["active", "manual"].includes(e.status)
    );
    const hasAttempted = member.enrollments.some((e) =>
      ["pending", "failed"].includes(e.status)
    );

    if (hasPaid) {
      return (
        <span className="inline-flex rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage-dark">
          Paid
        </span>
      );
    }
    if (hasAttempted) {
      return (
        <span className="inline-flex rounded-full bg-dawn-gold/15 px-2.5 py-0.5 text-xs font-medium text-dawn-gold-dark">
          Started checkout
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Never attempted
      </span>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) =>
              setSearch((e.target as HTMLInputElement).value)
            }
          />
        </div>

        <div className="relative">
          <select
            className="appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterStatus)}
          >
            <option value="all">All members</option>
            <option value="paid">Paid</option>
            <option value="attempted">Started checkout</option>
            <option value="never">Never attempted</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>

        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Phone
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Signed Up
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-botanical">
                    <button
                      className="text-left hover:text-bloom-rose transition-colors"
                      onClick={() =>
                        setExpandedMember(
                          expandedMember === member.id ? null : member.id
                        )
                      }
                    >
                      {member.full_name || "—"}
                    </button>
                    {/* Expanded enrollment details */}
                    {expandedMember === member.id &&
                      member.enrollments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {member.enrollments.map((e, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <span className="truncate max-w-[150px]">
                                {e.course_title}
                              </span>
                              <span>·</span>
                              <span
                                className={
                                  ["active", "manual"].includes(e.status)
                                    ? "text-sage-dark"
                                    : e.status === "pending" || e.status === "failed"
                                      ? "text-dawn-gold-dark"
                                      : "text-muted-foreground"
                                }
                              >
                                {e.status}
                                {e.status === "manual" && e.note && ` (${e.note})`}
                              </span>
                              {e.amount_paid ? (
                                <span>
                                  ₹{e.amount_paid.toLocaleString("en-IN")}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {member.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(member.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">{enrollmentBadge(member)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setGrantModal(member);
                        setGrantCourseId(courses[0]?.id || "");
                      }}
                    >
                      <UserPlus className="size-3.5" />
                      Grant
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Access Modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-botanical/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-bloom-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-botanical">
                Grant Access
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setGrantModal(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Manually enroll{" "}
              <span className="font-medium text-botanical">
                {grantModal.full_name || grantModal.email}
              </span>{" "}
              in a course. This will be tagged as &quot;manual&quot; in analytics.
            </p>

            <div className="space-y-2">
              <Label>Course</Label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={grantCourseId}
                  onChange={(e) => setGrantCourseId(e.target.value)}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={grantNote}
                onChange={(e) =>
                  setGrantNote((e.target as HTMLInputElement).value)
                }
                placeholder="e.g. Paid via direct UPI"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleGrant} disabled={granting || !grantCourseId}>
                {granting && <Loader2 className="size-4 animate-spin" />}
                Grant Access
              </Button>
              <Button variant="ghost" onClick={() => setGrantModal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
