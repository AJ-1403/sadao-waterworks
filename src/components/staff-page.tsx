"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Staff } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ข้อ 2.4: SaveState รวมสถานะของ mutation — idle/saving/success/error */
type SaveState = "idle" | "saving" | "success" | "error";

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  // ข้อ 2.4/2.5: SaveState + กัน double-submit สำหรับ createStaff
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  /* ข้อ 2.4: แสดงข้อความสำเร็จค้างไว้ 2.5 วินาทีแล้วกลับสู่ idle */
  function flashSuccess(text: string) {
    setSaveState("success");
    setMessage(text);

    setTimeout(() => {
      setSaveState("idle");
      setMessage("");
    }, 2500);
  }

  async function loadStaff() {
    try {
      setStaff(await api<Staff[]>("listStaff"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // เก็บ ref ไว้ก่อน await
    const form = new FormData(formElement);

    // ข้อ 2.5: กัน double-submit
    if (saveState === "saving") return;

    setSaveState("saving");

    try {
      await api("createStaff", {
        username: form.get("username"),
        fullName: form.get("fullName"),
        position: form.get("position"),
        phone: form.get("phone"),
        password: form.get("password"),
      });

      setOpen(false);
      formElement.reset();
      flashSuccess("เพิ่มพนักงานสำเร็จ");
      await loadStaff();
    } catch (error) {
      setError(error instanceof Error ? error.message : "เพิ่มพนักงานไม่สำเร็จ");
      setSaveState("error");
    } finally {
      // ข้อ 2.4: รับประกันสถานะไม่ค้างที่ "saving" เสมอ
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลพนักงาน</h1>
          <p className="text-sm text-muted-foreground">จัดการเจ้าหน้าที่ออกบิลและรับชำระเงิน</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มพนักงาน
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มพนักงาน</DialogTitle>
            </DialogHeader>

            <form onSubmit={createStaff} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input name="username" required />
              </div>
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล</Label>
                <Input name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label>ตำแหน่ง</Label>
                <Input name="position" defaultValue="เจ้าหน้าที่ออกบิล" />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input name="phone" />
              </div>
              <div className="space-y-2">
                <Label>รหัสผ่าน</Label>
                <Input name="password" type="password" required />
              </div>
              <Button
                type="submit"
                disabled={saveState === "saving"}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {/* ข้อ 2.4/2.5: disable ระหว่าง saving กัน double-submit */}
                {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูล"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ข้อ 2.4: แสดงข้อความสำเร็จ (inline แทน toast library) */}
      {saveState === "success" && message && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายชื่อพนักงาน ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>เบอร์โทร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((item) => (
                <TableRow key={item.staffId}>
                  <TableCell>{item.username}</TableCell>
                  <TableCell className="font-medium">{item.fullName}</TableCell>
                  <TableCell>{item.position}</TableCell>
                  <TableCell>{item.phone || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}