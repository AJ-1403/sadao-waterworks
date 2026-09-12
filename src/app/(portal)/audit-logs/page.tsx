import { requireRole } from "@/lib/auth";
import { AuditLogsPage } from "@/components/audit-logs-page";

// ส่วนที่ 5.2: หน้าประวัติการใช้งาน — admin เท่านั้น (ตรวจซ้ำที่ backend ด้วย listAuditLogs_)
export default async function AuditLogs() {
  await requireRole(["admin"]);
  return <AuditLogsPage />;
}