"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";

interface Payment {
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

const statusColors: Record<string, string> = {
  active: "bg-sage/15 text-sage-dark",
  manual: "bg-sage/15 text-sage-dark",
  pending: "bg-dawn-gold/15 text-dawn-gold-dark",
  failed: "bg-destructive/10 text-destructive",
};

export function PaymentsLog({ payments }: { payments: Payment[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = payments;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.user_name || "").toLowerCase().includes(q) ||
          p.user_email.toLowerCase().includes(q) ||
          p.course_title.toLowerCase().includes(q) ||
          (p.razorpay_order_id || "").toLowerCase().includes(q) ||
          (p.razorpay_payment_id || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [payments, search, statusFilter]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, order ID…"
            value={search}
            onChange={(e) =>
              setSearch((e.target as HTMLInputElement).value)
            }
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="manual">Manual</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Course
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Order ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Payment ID
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-botanical">
                      {p.user_name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.user_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                    {p.course_title}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <code className="text-xs text-muted-foreground">
                      {p.razorpay_order_id || "—"}
                    </code>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <code className="text-xs text-muted-foreground">
                      {p.razorpay_payment_id || "—"}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.amount_paid != null ? (
                      <div>
                        <span className="font-medium text-botanical">
                          ₹{p.amount_paid.toLocaleString("en-IN")}
                        </span>
                        {p.gst_amount != null && p.gst_amount > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            incl. ₹{p.gst_amount.toLocaleString("en-IN")} GST
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[p.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.note && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                        {p.note}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <div className="text-[10px]">
                      {new Date(p.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No payment records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
