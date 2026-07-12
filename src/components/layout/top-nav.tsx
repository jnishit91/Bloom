import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BloomLogo } from "./bloom-logo";
import { ProfileMenu } from "./profile-menu";
import { BloomAiButton } from "./bloom-ai-button";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";

export async function TopNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null } | null =
    null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-ivory/80 backdrop-blur-md" role="banner">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <BloomLogo />
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            <NavLink href="/home">Home</NavLink>
            <NavLink href="/courses">Courses</NavLink>
            <NavLink href="/community">Community</NavLink>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <BloomAiButton />

          {user && profile ? (
            <ProfileMenu
              user={{
                email: user.email,
                fullName: profile.full_name || undefined,
                avatarUrl: profile.avatar_url || undefined,
              }}
            />
          ) : (
            <Link href="/login">
              <Button size="sm">Log in</Button>
            </Link>
          )}

          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-botanical rounded-lg hover:bg-muted"
    >
      {children}
    </Link>
  );
}
