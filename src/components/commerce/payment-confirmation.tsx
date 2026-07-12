"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, PartyPopper, AlertCircle, RotateCcw, Receipt } from "lucide-react";

interface ReceiptData {
  orderId: string | null;
  paymentId: string | null;
  amount: number | null;
  baseAmount: number | null;
  gstAmount: number | null;
  gstRate: number | null;
  date: string | null;
}

export function PaymentConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId");
  const isFailed = searchParams.get("failed") === "true";

  const [status, setStatus] = useState<"polling" | "active" | "failed">(
    isFailed ? "failed" : "polling",
  );
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!enrollmentId || status !== "polling") return;

    const interval = setInterval(async () => {
      pollCount.current++;

      try {
        const res = await fetch(
          `/api/checkout/status?enrollmentId=${enrollmentId}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        setCourseSlug(data.courseSlug);
        setCourseTitle(data.courseTitle);
        setReceipt(data.receipt);

        if (data.status === "active") {
          setFirstLessonId(data.firstLessonId);
          setStatus("active");
          clearInterval(interval);
        } else if (data.status === "failed") {
          setStatus("failed");
          clearInterval(interval);
        }
      } catch {
        // Keep polling
      }

      // Stop after 30 attempts (~30s)
      if (pollCount.current >= 30) {
        setStatus("failed");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enrollmentId, status]);

  if (status === "polling") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="size-10 text-bloom-rose animate-spin mb-4" />
        <h2 className="font-display text-2xl text-botanical mb-2">
          Confirming your payment…
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          This usually takes just a few seconds. Please don&apos;t close this page.
        </p>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-bloom-rose/20 flex items-center justify-center mb-4 animate-check-pop">
          <PartyPopper className="size-10 text-bloom-rose" />
        </div>
        <h2 className="font-display text-3xl text-botanical mb-2">
          Welcome to {courseTitle}!
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          Your enrollment is confirmed. Your transformation journey begins now.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {firstLessonId && courseSlug && (
            <Button
              size="lg"
              onClick={() =>
                router.push(`/learn/${courseSlug}/${firstLessonId}`)
              }
            >
              Start Lesson 1
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReceipt(!showReceipt)}
            className="gap-1.5"
          >
            <Receipt className="size-4" />
            {showReceipt ? "Hide Receipt" : "View Receipt"}
          </Button>
        </div>

        {showReceipt && receipt && (
          <ReceiptCard
            receipt={receipt}
            courseTitle={courseTitle}
          />
        )}
      </div>
    );
  }

  // Failed
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h2 className="font-display text-2xl text-botanical mb-2">
        Payment didn&apos;t go through
      </h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Don&apos;t worry — no money has been charged. You can try again anytime.
      </p>
      <div className="flex items-center gap-3">
        {courseSlug ? (
          <Button
            onClick={() => router.push(`/courses/${courseSlug}`)}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            Try Again
          </Button>
        ) : (
          <Button onClick={() => router.push("/courses")} className="gap-1.5">
            Browse Courses
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/home")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

function ReceiptCard({
  receipt,
  courseTitle,
}: {
  receipt: ReceiptData;
  courseTitle: string | null;
}) {
  return (
    <div className="mt-6 w-full max-w-sm mx-auto rounded-bloom border border-border bg-white p-5 text-left shadow-bloom-sm">
      <h3 className="font-display text-base text-botanical mb-3 text-center">
        Payment Receipt
      </h3>
      <dl className="space-y-2 text-sm">
        {courseTitle && (
          <Row label="Course" value={courseTitle} />
        )}
        {receipt.orderId && (
          <Row label="Order ID" value={receipt.orderId} mono />
        )}
        {receipt.paymentId && (
          <Row label="Payment ID" value={receipt.paymentId} mono />
        )}
        {receipt.baseAmount != null && (
          <Row label="Base Amount" value={`₹${receipt.baseAmount.toLocaleString("en-IN")}`} />
        )}
        {receipt.gstAmount != null && receipt.gstRate != null && (
          <Row
            label={`GST (${receipt.gstRate}%)`}
            value={`₹${receipt.gstAmount.toLocaleString("en-IN")}`}
          />
        )}
        {receipt.amount != null && (
          <div className="flex justify-between pt-2 border-t border-border font-medium text-botanical">
            <span>Total</span>
            <span>₹{receipt.amount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {receipt.date && (
          <Row
            label="Date"
            value={new Date(receipt.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        )}
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-botanical text-right ${mono ? "font-mono text-xs mt-0.5" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
