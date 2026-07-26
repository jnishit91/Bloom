'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, BookOpen, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
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
          <div className="absolute top-0 right-0 h-full w-64 bg-ivory shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="font-display text-lg text-botanical">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="px-2 py-3 space-y-1">
              <Link
                href="/courses"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-botanical hover:bg-muted transition-colors"
              >
                <BookOpen className="size-5 text-muted-foreground" />
                Courses
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-botanical hover:bg-muted transition-colors"
              >
                <LogIn className="size-5 text-muted-foreground" />
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-botanical hover:bg-muted transition-colors"
              >
                <UserPlus className="size-5 text-muted-foreground" />
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
