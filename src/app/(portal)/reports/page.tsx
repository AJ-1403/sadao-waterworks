import { requireRole } from "@/lib/auth";
import { ReportsPage } from "@/components/reports-page";

export default async function Reports() {
  await requireRole(["admin", "staff"]);
  return <ReportsPage />;
}
