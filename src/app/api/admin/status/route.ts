import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function GET() {
  return withAdmin(async (supabase) => {
    const checks: {
      name: string;
      status: "ok" | "error";
      message: string;
    }[] = [];

    // 1. Database connection
    try {
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      checks.push(
        error
          ? { name: "Database", status: "error", message: error.message }
          : { name: "Database", status: "ok", message: "Connected" }
      );
    } catch (e) {
      checks.push({
        name: "Database",
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }

    // 2. Razorpay keys
    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (rzpKeyId && rzpKeySecret) {
      checks.push({
        name: "Razorpay Keys",
        status: "ok",
        message: `Key ID: ${rzpKeyId.slice(0, 8)}…`,
      });
    } else {
      checks.push({
        name: "Razorpay Keys",
        status: "error",
        message: "Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET",
      });
    }

    // 3. Razorpay webhook secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    checks.push(
      webhookSecret
        ? {
            name: "Webhook Secret",
            status: "ok",
            message: "Configured",
          }
        : {
            name: "Webhook Secret",
            status: "error",
            message: "Missing RAZORPAY_WEBHOOK_SECRET",
          }
    );

    // 4. AI endpoint
    const aiBaseUrl = process.env.AI_BASE_URL;
    if (aiBaseUrl) {
      try {
        const res = await fetch(`${aiBaseUrl}/models`, {
          signal: AbortSignal.timeout(5000),
          headers: process.env.AI_API_KEY
            ? { Authorization: `Bearer ${process.env.AI_API_KEY}` }
            : {},
        });
        checks.push(
          res.ok
            ? {
                name: "AI Endpoint",
                status: "ok",
                message: `${aiBaseUrl} — reachable`,
              }
            : {
                name: "AI Endpoint",
                status: "error",
                message: `${aiBaseUrl} returned ${res.status}`,
              }
        );
      } catch {
        checks.push({
          name: "AI Endpoint",
          status: "error",
          message: `${aiBaseUrl} — unreachable`,
        });
      }
    } else {
      checks.push({
        name: "AI Endpoint",
        status: "error",
        message: "Missing AI_BASE_URL",
      });
    }

    // 5. Supabase service role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    checks.push(
      serviceKey
        ? {
            name: "Service Role Key",
            status: "ok",
            message: "Configured",
          }
        : {
            name: "Service Role Key",
            status: "error",
            message: "Missing SUPABASE_SERVICE_ROLE_KEY",
          }
    );

    return NextResponse.json({ checks });
  });
}
