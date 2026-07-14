"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "./google-button";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Your name helps us personalise your experience";
    if (!email.trim()) newErrors.email = "We need your email to create your account";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "That doesn't look like a valid email";
    if (password.length < 6)
      newErrors.password = "Password should be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone: phone || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: data.error });
        } else {
          setErrors({ form: data.error || "Something went wrong" });
        }
        setLoading(false);
        return;
      }

      // Account created and auto-confirmed — sign in immediately
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (signInError) {
        setErrors({ form: "Account created but sign-in failed. Please try logging in." });
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setLoading(false);
      setErrors({ form: "Network error. Please try again." });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-botanical tracking-tight">
          Begin your bloom
        </h1>
        <p className="text-muted-foreground">
          Create your account and start transforming your relationships.
        </p>
      </div>

      <GoogleButton redirectTo={redirectTo} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-ivory px-3 text-muted-foreground">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.form}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-sm text-bloom-rose">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-bloom-rose">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-bloom-rose">{errors.password}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating your account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${redirectTo !== "/home" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-bloom-rose hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
