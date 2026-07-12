import { Suspense } from "react";
import { PaymentConfirmation } from "@/components/commerce/payment-confirmation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enrollment — Bloom",
};

export default function EnrollPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-bloom-rose border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PaymentConfirmation />
      </Suspense>
    </div>
  );
}
