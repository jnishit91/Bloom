"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

interface CheckoutButtonProps {
  courseId: string;
  courseSlug: string;
  priceInr: number;
  className?: string;
  size?: "default" | "lg";
}

export function CheckoutButton({
  courseId,
  courseSlug,
  priceInr,
  className,
  size = "lg",
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      // Load Razorpay script if not already loaded
      await loadRazorpayScript();

      // Create order + pending enrollment
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Already enrolled") {
          router.push(`/courses/${courseSlug}`);
          return;
        }
        if (data.error === "Unauthorized") {
          router.push(`/login?redirect=/courses/${courseSlug}`);
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }

      // Open Razorpay Checkout modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Bloom",
        description: data.courseTitle,
        order_id: data.orderId,
        prefill: data.prefill,
        theme: {
          color: "#E75D7C",
          backdrop_color: "rgba(14, 27, 20, 0.7)",
        },
        config: {
          display: {
            blocks: {
              utib: { name: "Pay using UPI", instruments: [{ method: "upi" }] },
              other: {
                name: "Other methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.utib", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: function () {
          // Payment completed — redirect to confirmation page
          router.push(
            `/courses/${courseSlug}/enroll?enrollmentId=${data.enrollmentId}`,
          );
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        router.push(
          `/courses/${courseSlug}/enroll?enrollmentId=${data.enrollmentId}&failed=true`,
        );
      });
      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);
      alert(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        size={size}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Starting checkout…
          </>
        ) : (
          <>
            Enroll Now — ₹{priceInr.toLocaleString("en-IN")}
          </>
        )}
      </Button>
      <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        <span>Secure payment via Razorpay · UPI, cards, netbanking</span>
      </div>
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(script);
  });
}
