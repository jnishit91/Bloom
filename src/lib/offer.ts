export const ORIGINAL_PRICE = 50_000;
export const OFFER_PRICE = 5_000;

export function getOfferDeadline(): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 2);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

export function formatOfferDeadline(): string {
  const d = getOfferDeadline();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
