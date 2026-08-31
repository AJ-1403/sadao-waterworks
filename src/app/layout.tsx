import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบประปาหมู่บ้านสะเดาพัฒนา",
  description: "ระบบจัดการบิลค่าน้ำและรับชำระเงิน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

