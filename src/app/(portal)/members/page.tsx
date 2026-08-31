import { requireRole } from "@/lib/auth";
import { MembersPage } from "@/components/members-page";

export default async function Members() {
  await requireRole(["admin", "staff"]);
  return <MembersPage />;
}
