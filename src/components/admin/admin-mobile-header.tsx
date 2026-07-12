"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BloomLogo } from "@/components/layout/bloom-logo";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
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

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-ivory/90 backdrop-blur-md px-4">
        <div className="flex items-center gap-2">
          <BloomLogo />
          <span className="rounded-md bg-bloom-rose/10 px-2 py-0.5 text-xs font-semibold text-bloom-rose">
            Admin
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 top-14 z-40 bg-ivory/95 backdrop-blur-md p-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-bloom-rose/10 text-bloom-rose"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
          <div className="border-t border-border pt-2 mt-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-5" />
              Back to app
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
