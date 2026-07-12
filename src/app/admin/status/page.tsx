"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Activity,
} from "lucide-react";

interface Check {
  name: string;
  status: "ok" | "error";
  message: string;
}

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);

  const runChecks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      setChecks(data.checks || []);
    } catch {
      setChecks([
        {
          name: "Health Check",
          status: "error",
          message: "Failed to reach the server",
        },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.status === "ok");
  const errorCount = checks.filter((c) => c.status === "error").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-botanical">
            System Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Running checks…"
              : allOk
                ? "All systems operational"
                : `${errorCount} issue${errorCount !== 1 ? "s" : ""} detected`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runChecks}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Recheck
        </Button>
      </div>

      {/* Overall status banner */}
      {!loading && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-5 ${
            allOk
              ? "bg-sage/10 border border-sage/20"
              : "bg-destructive/5 border border-destructive/20"
          }`}
        >
          {allOk ? (
            <CheckCircle2 className="size-8 text-sage-dark" />
          ) : (
            <XCircle className="size-8 text-destructive" />
          )}
          <div>
            <p
              className={`text-lg font-heading font-semibold ${
                allOk ? "text-sage-dark" : "text-destructive"
              }`}
            >
              {allOk ? "Everything looks good" : "Attention needed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {allOk
                ? "All services are connected and configured correctly."
                : "One or more services need attention. Check the details below."}
            </p>
          </div>
        </div>
      )}

      {/* Individual checks */}
      <div className="space-y-3">
        {loading && checks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="size-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          checks.map((check, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              {check.status === "ok" ? (
                <CheckCircle2 className="size-5 text-sage-dark shrink-0" />
              ) : (
                <XCircle className="size-5 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-botanical">
                  {check.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {check.message}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
                  check.status === "ok"
                    ? "bg-sage/15 text-sage-dark"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {check.status === "ok" ? "OK" : "Error"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
