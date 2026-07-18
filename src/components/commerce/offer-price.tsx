"use client";

import { ORIGINAL_PRICE, OFFER_PRICE, getOfferDeadline } from "@/lib/offer";

interface OfferPriceProps {
  layout?: "inline" | "block" | "hero";
}

function useDeadlineLabel() {
  const d = getOfferDeadline();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function OfferPriceInline() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="line-through text-muted-foreground">
        ₹{ORIGINAL_PRICE.toLocaleString("en-IN")}
      </span>
      <span className="font-semibold text-botanical">
        ₹{OFFER_PRICE.toLocaleString("en-IN")}
      </span>
    </span>
  );
}

export function OfferPriceBlock({ className }: { className?: string }) {
  const deadline = useDeadlineLabel();

  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <span className="line-through text-muted-foreground text-sm">
          ₹{ORIGINAL_PRICE.toLocaleString("en-IN")}
        </span>
        <span className="font-semibold text-botanical text-lg">
          ₹{OFFER_PRICE.toLocaleString("en-IN")}
        </span>
      </div>
      <p className="text-xs text-bloom-rose font-medium mt-0.5">
        Limited period offer · Ends {deadline}
      </p>
    </div>
  );
}

export function OfferPriceHero() {
  const deadline = useDeadlineLabel();

  return (
    <div>
      <p className="line-through text-white/50 text-2xl">
        ₹{ORIGINAL_PRICE.toLocaleString("en-IN")}
      </p>
      <p className="font-display text-5xl mt-1">
        ₹{OFFER_PRICE.toLocaleString("en-IN")}
      </p>
      <p className="text-dawn-gold mt-2 text-sm font-medium">
        Limited period offer · Ends {deadline}
      </p>
    </div>
  );
}
