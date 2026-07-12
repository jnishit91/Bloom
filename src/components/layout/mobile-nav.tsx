"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        <Menu className="size-5" />
        <span className="sr-only">Menu</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-64 bg-ivory shadow-bloom-lg animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="font-display text-lg text-botanical">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="px-2 py-3 space-y-1" aria-label="Mobile navigation">
              <MobileLink href="/home" icon={Home} onClick={() => setOpen(false)}>
                Home
              </MobileLink>
              <MobileLink href="/courses" icon={BookOpen} onClick={() => setOpen(false)}>
                Courses
              </MobileLink>
              <MobileLink href="/community" icon={Users} onClick={() => setOpen(false)}>
                Community
              </MobileLink>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-botanical hover:bg-muted transition-colors"
    >
      <Icon className="size-5 text-muted-foreground" />
      {children}
    </Link>
  );
}
