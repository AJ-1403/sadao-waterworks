import { requireUser } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";
import { UserProvider } from "@/components/providers";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <UserProvider user={user}>
      <PortalShell user={user}>{children}</PortalShell>
    </UserProvider>
  );
}
