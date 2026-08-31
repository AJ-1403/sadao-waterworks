"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Droplets,
  FileText,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, money } from "@/lib/api";
import type { DashboardData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/components/providers";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const user = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("getDashboard")
      .then(setData)
      .catch((error) => setError(error.message));
  }, []);

  if (error) {
    return <p className="rounded-md bg-red-50 p-4 text-red-700">{error}</p>;
  }

  if (!data) {
    return <p className="p-6 text-muted-foreground">กำลังโหลดข้อมูล...</p>;
  }

  const cards = [
    {
      title: "ยอดบิลทั้งหมด",
      value: money(data.summary.totalWaterAmount),
      icon: FileText,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "รับชำระแล้ว",
      value: money(data.summary.totalPaidAmount),
      icon: WalletCards,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "ยอดค้างชำระ",
      value: money(data.summary.totalOutstanding),
      icon: Banknote,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: user.role === "member" ? "จำนวนบิล" : "จำนวนลูกบ้าน",
      value:
        user.role === "member"
          ? String(data.summary.totalBills)
          : String(data.summary.totalMembers || 0),
      icon: user.role === "member" ? Droplets : Users,
      color: "bg-teal-100 text-teal-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สวัสดี, {user.fullName}</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมระบบประปาหมู่บ้านสะเดาพัฒนา
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      {user.role === "member" && data.latestBill && (
        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle className="text-lg">บิลล่าสุด</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">รอบบิล</p>
              <p className="font-semibold">{data.latestBill.billingPeriod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ใช้น้ำ</p>
              <p className="font-semibold">{data.latestBill.unitsUsed} หน่วย</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ยอดรวม</p>
              <p className="font-semibold">{money(data.latestBill.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ครบกำหนด</p>
              <p className="font-semibold">{data.latestBill.dueDate}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">สรุปรายเดือนย้อนหลัง 12 เดือน</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...data.monthlySummary].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="billingPeriod" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                formatter={(value) => money(Number(value))}
                labelFormatter={(label) => `รอบบิล ${label}`}
              />
              <Bar dataKey="paidAmount" name="รับชำระแล้ว" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outstandingAmount" name="ค้างชำระ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
