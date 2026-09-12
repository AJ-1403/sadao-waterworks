"use client";

/* ส่วนที่ 10.2/10.3: หน้ารายงาน
   - กราฟเส้นแนวโน้ม 12 เดือน (recharts — มีใน package อยู่แล้ว) จาก monthlySummary เดิม
   - ปุ่มส่งออก CSV (papaparse) จากข้อมูลดิบ exportBills/exportPayments ใหม่ */

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Papa from "papaparse";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, money } from "@/lib/api";
import type { DashboardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SaveState = "idle" | "saving" | "success" | "error";

/* ส่วนที่ 10.2: ดาวน์โหลด CSV จาก array ของ object ด้วย papaparse
   (เติม BOM ให้ Excel อ่านภาษาไทยถูกต้อง) */
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    api<DashboardData>("getDashboard")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "โหลดรายงานไม่สำเร็จ")
      );
  }, []);

  /* ส่วนที่ 10.2: export บิลทั้งหมดเป็น CSV (action exportBills ใหม่) */
  async function exportBillsCsv() {
    if (saveState === "saving") return;

    setSaveState("saving");
    setError("");

    try {
      const rows = await api<Record<string, unknown>[]>("exportBills");

      downloadCsv(
        `bills-${new Date().toISOString().slice(0, 10)}.csv`,
        rows.map((row) => ({
          ...row,
          createdAt: String(row.createdAt || "").slice(0, 19).replace("T", " "),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งออกข้อมูลไม่สำเร็จ");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  /* ส่วนที่ 10.2: export การชำระเงินทั้งหมดเป็น CSV (action exportPayments ใหม่
     — รวมรายการที่ถูก void เพื่อให้บัญชีตรวจสอบได้ครบ) */
  async function exportPaymentsCsv() {
    if (saveState === "saving") return;

    setSaveState("saving");
    setError("");

    try {
      const rows = await api<Record<string, unknown>[]>("exportPayments");

      downloadCsv(
        `payments-${new Date().toISOString().slice(0, 10)}.csv`,
        rows.map((row) => ({
          ...row,
          paidAt: String(row.paidAt || "").slice(0, 19).replace("T", " "),
          voided: row.voided ? "yes" : "no",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งออกข้อมูลไม่สำเร็จ");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  if (error) {
    return <p className="rounded-md bg-red-50 p-4 text-red-700">{error}</p>;
  }

  if (!data) {
    return <p className="text-muted-foreground">กำลังโหลดรายงาน...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">รายงานสรุปค่าน้ำ</h1>
          <p className="text-sm text-muted-foreground">สรุปยอดเรียกเก็บ รับชำระ และยอดค้างรายเดือน</p>
        </div>

        {/* ส่วนที่ 10.2: ปุ่มส่งออก Excel/CSV */}
        <div className="flex gap-2">
          <Button variant="outline" disabled={saveState === "saving"} onClick={exportBillsCsv}>
            <Download className="mr-2 h-4 w-4" />
            {saveState === "saving" ? "กำลังเตรียมไฟล์..." : "ส่งออกบิล (CSV)"}
          </Button>
          <Button variant="outline" disabled={saveState === "saving"} onClick={exportPaymentsCsv}>
            <Download className="mr-2 h-4 w-4" />
            ส่งออกการชำระ (CSV)
          </Button>
        </div>
      </div>

      {/* ส่วนที่ 10.3: กราฟเส้นแนวโน้ม 12 เดือน — ใช้ monthlySummary ที่มีอยู่แล้ว (ไม่แก้ backend) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">แนวโน้ม 12 เดือนย้อนหลัง</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...data.monthlySummary].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="billingPeriod" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="totalAmount" name="ยอดเรียกเก็บ" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="paidAmount" name="รับชำระแล้ว" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="outstandingAmount" name="ค้างชำระ" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
