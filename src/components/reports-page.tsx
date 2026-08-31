"use client";

import { useEffect, useState } from "react";
import { api, money } from "@/lib/api";
import type { DashboardData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api<DashboardData>("getDashboard").then(setData);
  }, []);

  if (!data) {
    return <p className="text-muted-foreground">กำลังโหลดรายงาน...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">รายงานสรุปค่าน้ำ</h1>
        <p className="text-sm text-muted-foreground">สรุปยอดเรียกเก็บ รับชำระ และยอดค้างรายเดือน</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายงานย้อนหลัง 12 เดือน</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รอบบิล</TableHead>
                <TableHead>หน่วยใช้น้ำรวม</TableHead>
                <TableHead>ยอดเรียกเก็บ</TableHead>
                <TableHead>รับชำระแล้ว</TableHead>
                <TableHead>ยอดค้างชำระ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthlySummary.map((item) => (
                <TableRow key={item.billingPeriod}>
                  <TableCell className="font-medium">{item.billingPeriod}</TableCell>
                  <TableCell>{item.totalUnits.toLocaleString("th-TH")} หน่วย</TableCell>
                  <TableCell>{money(item.totalAmount)}</TableCell>
                  <TableCell className="text-emerald-700">{money(item.paidAmount)}</TableCell>
                  <TableCell className="text-amber-700">{money(item.outstandingAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}