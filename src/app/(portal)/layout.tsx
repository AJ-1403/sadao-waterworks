import { requireUser } from "@/lib/auth";
import { PortalShell } from "@/components/portal-shell";
import { UserProvider } from "@/components/providers";

// ข้อ 2.1: ลบ export const dynamic = "force-dynamic" ออก
// เหตุผล: force-dynamic บังคับให้ layout รัน render ใหม่ทุก request แบบไม่มีเงื่อนไข
// ทั้งที่ requireUser() ใช้ cookies() อยู่แล้ว Next.js จะ render แบบ dynamic ให้เองเมื่อจำเป็น
// ทำให้ Next.js จัดการ caching/streaming ของ route ได้เอง ลด lag ตอนเปลี่ยนหน้า
// (ความปลอดภัยไม่ลดลง — การ verify session จริงยังเกิดที่ GAS ทุก sensitive action)
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
