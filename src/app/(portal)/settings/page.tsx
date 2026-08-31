import { requireRole } from "@/lib/auth";
import { SettingsPage } from "@/components/settings-page";

export default async function Settings() {
  await requireRole(["admin"]);
  return <SettingsPage />;
}
