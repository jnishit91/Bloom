import { requireAdmin } from "@/lib/admin";
import { getMembers } from "@/lib/admin-queries";
import { MembersTable } from "@/components/admin/members-table";

export default async function MembersPage() {
  const { supabase } = await requireAdmin();
  const members = await getMembers(supabase);

  // Get courses for the grant access modal
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .order("title");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-botanical">
          Members
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {members.length} registered user{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      <MembersTable members={members} courses={courses || []} />
    </div>
  );
}
