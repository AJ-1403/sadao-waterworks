import { requireRole } from "@/lib/auth";
import { StaffPage } from "@/components/staff-page";

export default async function Staff() {
  await requireRole(["admin"]);
  return <StaffPage />;
}
