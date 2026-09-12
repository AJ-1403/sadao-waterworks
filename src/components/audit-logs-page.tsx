"use client";

/* ส่วนที่ 5.2: หน้าประวัติการใช้งานระบบ (Audit Log Viewer)
   - ตาราง logs เรียงใหม่→เก่า (backend เรียงให้แล้ว)
   - filter: ช่วงวันที่ (startDate/endDate) + ประเภท action
   - SaveState เหมือนฟอร์มอื่น + ปุ่มโหลดเพิ่ม (pagination ด้วย offset) */

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, thaiDate } from "@/lib/api";
import type { AuditLogsResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SaveState = "idle" | "saving" | "success" | "error";

const PAGE_SIZE = 50;

export function AuditLogsPage() {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function loadLogs(offset = 0, append = false) {
    try {
      if (offset === 0) setSaveState("saving");

      const form = document.getElementById("audit-filter-form") as HTMLFormElement | null;
      const formData = form ? new FormData(form) : new FormData();

      const result = await api<AuditLogsResponse>("listAuditLogs", {
        startDate: formData.get("startDate") || "",
        endDate: formData.get("endDate") || "",
        action: formData.get("action") || "",
        limit: PAGE_SIZE,
        offset,
      });

      setData((current) =>
        append && current
          ? { ...result, logs: [...current.logs, ...result.logs] }
          : result
      );
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดประวัติไม่สำเร็จ");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  useEffect(() => {
    loadLogs(0);
  }, []);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadLogs(0);
  }

  const hasMore = data ? data.logs.length < data.total : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ประวัติการใช้งานระบบ</h1>
        <p className="text-sm text-muted-foreground">
          บันทึกทุกการเปลี่ยนแปลงข้อมูลสำคัญ เรียงจากล่าสุดไปเก่า (แสดงสูงสุด {PAGE_SIZE} รายการต่อหน้า)
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">กรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="audit-filter-form" onSubmit={applyFilter} className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>จากวันที่</Label>
              <Input name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label>ถึงวันที่</Label>
              <Input name="endDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label>ประเภทรายการ (Action)</Label>
              <Input name="action" placeholder="เช่น CREATE_BILL, CANCEL_BILL" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saveState === "saving"} className="w-full bg-teal-600 hover:bg-teal-700">
                {saveState === "saving" ? "กำลังค้นหา..." : "กรองข้อมูล"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            รายการทั้งหมด {data ? `${data.logs.length} / ${data.total}` : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>เป้าหมาย</TableHead>
                <TableHead>รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs.map((log, index) => (
                <TableRow key={log.logId || `row-${index}`}>
                  <TableCell className="whitespace-nowrap text-sm">{thaiDate(log.createdAt)}</TableCell>
                  <TableCell>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">{log.action}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.username}
                    <span className="ml-1 text-xs text-muted-foreground">({log.role})</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.targetType}
                    {log.targetId ? ` #${String(log.targetId).slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">{log.detail}</TableCell>
                </TableRow>
              ))}

              {data && data.logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    ไม่พบประวัติการใช้งานตามเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" disabled={saveState === "saving"} onClick={() => loadLogs(data!.logs.length, true)}>
                {saveState === "saving" ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
