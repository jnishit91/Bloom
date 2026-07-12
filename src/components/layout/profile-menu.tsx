"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

interface ProfileMenuProps {
  user: {
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="size-9 cursor-pointer ring-2 ring-transparent hover:ring-bloom-rose/30 transition-all duration-200">
          <AvatarImage src={user.avatarUrl} alt={user.fullName || "Profile"} />
          <AvatarFallback className="bg-sage text-white text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-bloom-sm">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-botanical truncate">
            {user.fullName || "Bloom Member"}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
