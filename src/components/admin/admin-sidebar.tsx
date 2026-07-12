"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BloomLogo } from "@/components/layout/bloom-logo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  BarChart3,
  Upload,
  Activity,
  ArrowLeft,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/status", label: "Health", icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-ivory lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <BloomLogo />
        <span className="rounded-md bg-bloom-rose/10 px-2 py-0.5 text-xs font-semibold text-bloom-rose">
          Admin
        </span>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-bloom-rose/10 text-bloom-rose"
                  : "text-muted-foreground hover:bg-muted hover:text-botanical"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/home"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-botanical"
        >
          <ArrowLeft className="size-4" />
          Back to app
        </Link>
      </div>
    </aside>
  );
}
