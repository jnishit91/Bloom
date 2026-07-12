import { requireAdmin } from "@/lib/admin";
import { getPayments } from "@/lib/admin-queries";
import { PaymentsLog } from "@/components/admin/payments-log";

export default async function PaymentsPage() {
  const { supabase } = await requireAdmin();
  const payments = await getPayments(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All enrollment transactions — your audit trail
        </p>
      </div>

      <PaymentsLog payments={payments} />
    </div>
  );
}
