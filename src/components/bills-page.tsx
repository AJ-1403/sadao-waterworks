"use client";

/* ส่วนที่ 3.4/4.2/6.3/9.2/11: หน้าจัดการบิล
   - ค้นหาบิล (debounce 300ms → backend กรองผ่าน listBills houseNo/fullName)
   - ปุ่มแก้ไข/ยกเลิกบิล (admin, เฉพาะบิลที่ยังไม่มีการชำระ)
   - โหมดออกบิลยกชุด (createBillsBatch) + แสดงเลขมิเตอร์ครั้งก่อนต่อแถว
   - SaveState ทุก mutation + กัน double-submit + idempotencyKey */

import { FormEvent, useEffect, useState } from "react";
import { Ban, Pencil, Plus, ReceiptText, Search } from "lucide-react";
import { api, money, thaiDate } from "@/lib/api";
import type { BatchBillingResult, Bill, Member } from "@/types";
import { useUser } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

/* ข้อ 11.1: SaveState รวมสถานะของ mutation ทุกฟอร์มในหน้านี้ */
type SaveState = "idle" | "saving" | "success" | "error";

function billBadge(status?: string) {
  if (status === "paid") return <Badge className="bg-emerald-600">ชำระแล้ว</Badge>;
  if (status === "overdue") return <Badge variant="destructive">เกินกำหนด</Badge>;
  if (status === "cancelled") return <Badge variant="secondary">ยกเลิก</Badge>;
  return <Badge className="bg-amber-500">ค้างชำระ</Badge>;
}

export function BillsPage() {
  const user = useUser();
  const [bills, setBills] = useState<Bill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  // ข้อ 11.6: idempotencyKey ต่อ 1 รอบการเปิดฟอร์ม (บิลเดี่ยว)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // ส่วนที่ 4.2: สถานะของโหมดออกบิลยกชุด
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchIdempotencyKey, setBatchIdempotencyKey] = useState(() => crypto.randomUUID());
  const [batchResult, setBatchResult] = useState<BatchBillingResult | null>(null);
  // เลขมิเตอร์ที่กรอกต่อแถว { [memberId]: "123" }
  const [batchMeters, setBatchMeters] = useState<Record<string, string>>({});

  // ส่วนที่ 9.2: ช่องค้นหา + debounce 300ms ก่อนยิง API ใหม่
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // ส่วนที่ 6.3: ลูกบ้านที่เลือกในฟอร์มออกบิลเดี่ยว (เพื่อแสดงเลขมิเตอร์ครั้งก่อน)
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // ส่วนที่ 3.4: เป้าหมายของ modal แก้ไข/ยกเลิกบิล
  const [editTarget, setEditTarget] = useState<Bill | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Bill | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  /* ข้อ 2.4: แสดงข้อความสำเร็จค้างไว้ 2.5 วินาทีแล้วกลับสู่ idle */
  function flashSuccess(text: string) {
    setSaveState("success");
    setMessage(text);

    setTimeout(() => {
      setSaveState("idle");
      setMessage("");
    }, 2500);
  }

  /* ส่วนที่ 9.2: debounce 300ms — รอให้พิมพ์จบก่อนค่อยอัปเดต filter */
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    // ข้อ 11.6: generate key ใหม่ทุกครั้งที่เปิดฟอร์ม
    if (nextOpen) {
      setIdempotencyKey(crypto.randomUUID());
    }
  }

  function handleBatchOpenChange(nextOpen: boolean) {
    setBatchOpen(nextOpen);
    if (nextOpen) {
      // เปิด batch ใหม่ = เริ่มรอบใหม่ ล้างผลลัพธ์และเลขมิเตอร์เดิม
      setBatchResult(null);
      setBatchMeters({});
      setBatchIdempotencyKey(crypto.randomUUID());
    }
  }

  async function loadData() {
    try {
      setError("");
      /* ยิงพร้อมกันด้วย Promise.all + ส่ง filter ไป backend (ส่วนที่ 9.1)
         appliedSearch ว่าง = ไม่ส่ง = ได้ทั้งหมดเหมือนเดิม */
      const searchParam = appliedSearch;
      const [billData, memberData] = await Promise.all([
        api<Bill[]>("listBills", searchParam ? { houseNo: searchParam, fullName: searchParam } : {}),
        user.role !== "member"
          ? api<Member[]>("listMembers")
          : Promise.resolve([] as Member[]),
      ]);

      setBills(billData);

      if (user.role !== "member") {
        setMembers(memberData);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch]);

  /* ส่วนที่ 6.3: ข้อมูลลูกบ้านที่เลือก (find จาก list ที่โหลดแล้ว ไม่ยิง API เพิ่ม) */
  const selectedMember = members.find((m) => m.memberId === selectedMemberId) || null;

    /* ข้อ 11.6 + ส่วนที่ 6.3: ออกบิลเดี่ยว — validate เลขมิเตอร์ฝั่ง frontend ก่อนส่ง */
  async function createBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (saveState === "saving") return;

    // ส่วนที่ 6.3: กันกรอกมิเตอร์น้อยกว่าครั้งก่อนตั้งแต่ต้น (ลด error จาก backend)
    const meterValue = Number(form.get("currentMeter"));
    const previousReading = selectedMember
      ? selectedMember.lastMeterReading
      : 0;

    if (selectedMember && meterValue < previousReading) {
      setError(
        "เลขมิเตอร์ปัจจุบันต้องไม่น้อยกว่าเลขมิเตอร์ครั้งก่อน (" +
          previousReading +
          " หน่วย)"
      );
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setError("");

    try {
      await api("createBill", {
        memberId: form.get("memberId"),
        billingPeriod: form.get("billingPeriod"),
        currentMeter: meterValue,
        dueDate: form.get("dueDate"),
        note: form.get("note"),
        idempotencyKey,
      });

      setOpen(false);
      formElement.reset();
      setSelectedMemberId("");
      flashSuccess("ออกบิลค่าน้ำสำเร็จ");
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ออกบิลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
      setIdempotencyKey(crypto.randomUUID());
    }
  }

  /* ส่วนที่ 4.2: ส่งข้อมูลออกบิลยกชุด — เฉพาะแถวที่กรอกเลขมิเตอร์ */
  async function submitBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (saveState === "saving") return;

    const billingPeriod = String(form.get("billingPeriod") || "");
    const dueDate = String(form.get("dueDate") || "");

    // สร้างรายการจากแถวที่กรอกเลขมิเตอร์ + validate ครั้งก่อนฝั่ง frontend
    const entries: { memberId: string; currentMeter: number }[] = [];

    for (const member of members) {
      const active = member.active === true || member.active === "true";

      if (!active) {
        continue; // ข้ามบ้านที่ปิดใช้งาน
      }

      const raw = batchMeters[member.memberId];

      if (raw === undefined || raw === "") {
        continue; // แถวที่ไม่กรอก = ข้ามบ้านนั้น
      }

      const meterValue = Number(raw);

      if (meterValue < member.lastMeterReading) {
        setError(
          "บ้าน " + member.houseNo + ": เลขมิเตอร์ต้องไม่น้อยกว่าครั้งก่อน (" +
            member.lastMeterReading + ")"
        );
        setSaveState("error");
        return;
      }

      entries.push({ memberId: member.memberId, currentMeter: meterValue });
    }

    if (!entries.length) {
      setError("กรุณากรอกเลขมิเตอร์อย่างน้อย 1 บ้าน");
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setError("");

    try {
      const result = await api<BatchBillingResult>("createBillsBatch", {
        billingPeriod,
        dueDate,
        bills: entries,
        idempotencyKey: batchIdempotencyKey,
      });

      setBatchResult(result);
      setBatchMeters({});
      flashSuccess(result.message);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ออกบิลยกชุดไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
      setBatchIdempotencyKey(crypto.randomUUID());
    }
  }

  /* ส่วนที่ 3.3: ส่งแก้ไขบิล (เฉพาะบิลที่ยังไม่มีการชำระ) */
  async function submitEditBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTarget || saveState === "saving") return;

    const form = new FormData(event.currentTarget);
    const meterValue = Number(form.get("currentMeter"));

    if (meterValue < editTarget.previousMeter) {
      setError(
        "เลขมิเตอร์ต้องไม่น้อยกว่าเลขเดิมในบิล (" + editTarget.previousMeter + ")"
      );
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setError("");

    try {
      await api("editBill", {
        billId: editTarget.billId,
        currentMeter: meterValue,
        dueDate: form.get("dueDate"),
        note: form.get("note"),
      });

      setEditOpen(false);
      setEditTarget(null);
      flashSuccess("แก้ไขบิลสำเร็จ");
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "แก้ไขบิลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  /* ส่วนที่ 3.1: ส่งยกเลิกบิล (ต้องมีเหตุผลเสมอ) */
  async function submitCancelBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cancelTarget || saveState === "saving") return;

    const reason = String(new FormData(event.currentTarget).get("reason") || "").trim();

    if (!reason) {
      setError("กรุณาระบุเหตุผลในการยกเลิกบิล");
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setError("");

    try {
      await api("cancelBill", {
        billId: cancelTarget.billId,
        reason,
      });

      setCancelOpen(false);
      setCancelTarget(null);
      flashSuccess("ยกเลิกบิลสำเร็จ");
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ยกเลิกบิลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  /* ส่วนที่ 3.4: บิลที่แก้ไข/ยกเลิกได้ = ยังไม่มีการชำระเงินเข้ามาเลย
     (status unpaid และ paidAmount = 0) — ให้ตรงกับเงื่อนไขของ backend */
  function isBillEditable(bill: Bill) {
    return bill.status === "unpaid" && Number(bill.paidAmount) === 0;
  }

    return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {user.role === "member" ? "บิลค่าน้ำของฉัน" : "จัดการบิลค่าน้ำ"}
          </h1>
          <p className="text-sm text-muted-foreground">
            ตรวจสอบประวัติการใช้น้ำและสถานะการชำระเงิน
          </p>
        </div>

        {user.role !== "member" && (
          <div className="flex flex-wrap gap-2">
            {/* ส่วนที่ 4.2: ปุ่มเปิดโหมดออกบิลยกชุด */}
            <Dialog open={batchOpen} onOpenChange={handleBatchOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline">ออกบิลทั้งหมด</Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  ออกบิลค่าน้ำ
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ข้อ 11.3: ข้อความสำเร็จค้าง 2.5 วินาที (inline แทน toast library) */}
      {saveState === "success" && message && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
      )}

      {/* ส่วนที่ 9.2: ช่องค้นหาบิล (บ้านเลขที่/ชื่อ) — debounce 300ms ส่งไป backend */}
      {user.role !== "member" && (
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="ค้นหาบิล: บ้านเลขที่ หรือ ชื่อลูกบ้าน"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {/* ส่วนที่ 4.2: Dialog ออกบิลยกชุด */}
      <Dialog open={batchOpen} onOpenChange={handleBatchOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ออกบิลทั้งหมด (เลือกบ้านที่ต้องการ)</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitBatch} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>รอบบิล (ใช้กับทุกบ้าน)</Label>
                <Input
                  name="billingPeriod"
                  type="month"
                  defaultValue={new Date().toISOString().slice(0, 7)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>วันครบกำหนดชำระ (ใช้กับทุกบ้าน)</Label>
                <Input name="dueDate" type="date" required />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              กรอกเลขมิเตอร์เฉพาะบ้านที่ต้องการออกบิล (เว้นว่าง = ข้ามบ้านนั้น) — แถวสีเทาคือบ้านที่ปิดใช้งาน
            </p>

            <div className="max-h-[45vh] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>บ้านเลขที่</TableHead>
                    <TableHead>ลูกบ้าน</TableHead>
                    <TableHead>มิเตอร์ครั้งก่อน</TableHead>
                    <TableHead>มิเตอร์ครั้งนี้</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const active =
                      member.active === true || member.active === "true";
                    const previous = member.lastMeterReading;

                    return (
                      <TableRow
                        key={member.memberId}
                        className={active ? "" : "bg-slate-50 text-slate-400"}
                      >
                        <TableCell className="font-medium">{member.houseNo}</TableCell>
                        <TableCell>{member.fullName}</TableCell>
                        <TableCell>
                          {/* ส่วนที่ 6.3: แสดงเลขมิเตอร์ครั้งก่อนกำกับทุกแถว */}
                          {previous.toLocaleString("th-TH")}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={previous}
                            disabled={!active || saveState === "saving"}
                            value={batchMeters[member.memberId] ?? ""}
                            onChange={(event) =>
                              setBatchMeters((current) => ({
                                ...current,
                                [member.memberId]: event.target.value,
                              }))
                            }
                            className="w-28"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        กำลังโหลดรายชื่อลูกบ้าน...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Button
              type="submit"
              disabled={saveState === "saving"}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {/* ข้อ 11.2/11.5: disable + ข้อความระหว่าง saving */}
              {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "ออกบิลรายการที่กรอกทั้งหมด"}
            </Button>
          </form>

          {/* ส่วนที่ 4.2: ผลลัพธ์หลังส่ง — สำเร็จ/ล้มเหลวรายบ้านพร้อมเหตุผล */}
          {batchResult && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-semibold">{batchResult.message}</p>

              {batchResult.failed.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700">รายการที่ไม่สำเร็จ:</p>
                  {batchResult.failed.map((item, index) => (
                    <p key={`${item.memberId}-${index}`} className="text-xs text-red-700">
                      • {item.memberId.slice(0, 12)}… — {item.reason}
                    </p>
                  ))}
                </div>
              )}

              {batchResult.success.length > 0 && (
                <p className="text-sm font-medium text-emerald-700">
                  ออกบิลสำเร็จ {batchResult.success.length} รายการ (ยอดรวม{" "}
                  {money(
                    batchResult.success.reduce(
                      (total, item) => total + Number(item.totalAmount),
                      0
                    )
                  )}
                  )
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ฟอร์มออกบิลเดี่ยว (เดิม + เพิ่มเลขมิเตอร์ครั้งก่อน + validation ส่วนที่ 6.3) */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ออกบิลค่าน้ำ</DialogTitle>
          </DialogHeader>

          <form onSubmit={createBill} className="space-y-4">
            <div className="space-y-2">
              <Label>ลูกบ้าน</Label>
              <Select
                name="memberId"
                required
                onValueChange={(value) => setSelectedMemberId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกลูกบ้าน" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.memberId} value={member.memberId}>
                      บ้าน {member.houseNo} - {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ส่วนที่ 6.3: ข้อความช่วย เลขมิเตอร์ครั้งก่อนของบ้านที่เลือก */}
              {selectedMember && (
                <p className="text-xs text-teal-700">
                  เลขมิเตอร์ครั้งก่อน: {selectedMember.lastMeterReading.toLocaleString("th-TH")} หน่วย
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>รอบบิล</Label>
              <Input
                name="billingPeriod"
                type="month"
                defaultValue={new Date().toISOString().slice(0, 7)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>เลขมิเตอร์ปัจจุบัน</Label>
              <Input
                name="currentMeter"
                type="number"
                /* ส่วนที่ 6.3: min = เลขมิเตอร์ครั้งก่อนของบ้านที่เลือก */
                min={selectedMember ? selectedMember.lastMeterReading : 0}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>วันครบกำหนดชำระ</Label>
              <Input name="dueDate" type="date" required />
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea name="note" placeholder="ถ้ามี" />
            </div>

            <Button
              type="submit"
              disabled={saveState === "saving"}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {/* ข้อ 11.2/11.5 */}
              {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "ยืนยันการออกบิล"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ส่วนที่ 3.3: Dialog แก้ไขบิล (admin, บิลที่ยังไม่มีการชำระ) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขบิล {editTarget?.billNo}</DialogTitle>
          </DialogHeader>

          {editTarget && (
            <form onSubmit={submitEditBill} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                มิเตอร์เดิมในบิล: {editTarget.previousMeter.toLocaleString("th-TH")} — ระบบจะคำนวณหน่วยใช้น้ำและยอดเงินใหม่ให้อัตโนมัติ
              </p>

              <div className="space-y-2">
                <Label>เลขมิเตอร์ปัจจุบัน</Label>
                <Input
                  name="currentMeter"
                  type="number"
                  min={editTarget.previousMeter}
                  defaultValue={editTarget.currentMeter}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>วันครบกำหนดชำระ</Label>
                <Input name="dueDate" type="date" defaultValue={editTarget.dueDate} />
              </div>

              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Textarea name="note" defaultValue={editTarget.note} />
              </div>

              <Button
                type="submit"
                disabled={saveState === "saving"}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "บันทึกการแก้ไข"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ส่วนที่ 3.4: Dialog ยืนยันยกเลิกบิล — ต้องกรอกเหตุผลเสมอ (ป้องกันกดพลาด) */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิกบิล</DialogTitle>
          </DialogHeader>

          {cancelTarget && (
            <form onSubmit={submitCancelBill} className="space-y-4">
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                บิล {cancelTarget.billNo} — บ้าน {cancelTarget.houseNo} ({cancelTarget.ownerName})
                รอบ {cancelTarget.billingPeriod} ยอด {money(cancelTarget.totalAmount)}
              </div>

              <div className="space-y-2">
                <Label>เหตุผลในการยกเลิก (บังคับกรอก)</Label>
                <Textarea name="reason" placeholder="เช่น ออกบิลผิดรอบ / ข้อมูลมิเตอร์ผิด" required />
              </div>

              <Button
                type="submit"
                disabled={saveState === "saving"}
                variant="destructive"
                className="w-full"
              >
                {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "ยืนยันยกเลิกบิล"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ReceiptText className="h-5 w-5 text-teal-600" />
            รายการบิล ({bills.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขบิล</TableHead>
                {user.role !== "member" && <TableHead>บ้านเลขที่ / ลูกบ้าน</TableHead>}
                <TableHead>รอบบิล</TableHead>
                <TableHead>ใช้น้ำ</TableHead>
                <TableHead>ยอดรวม</TableHead>
                <TableHead>ครบกำหนด</TableHead>
                <TableHead>สถานะ</TableHead>
                {/* ส่วนที่ 3.4: คอลัมน์จัดการ (admin) */}
                {user.role === "admin" && <TableHead className="text-right">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill, index) => (
                // fallback key กันข้อมูลจริงมี billId ว่าง/ซ้ำ
                <TableRow key={bill.billId || bill.billNo || `row-${index}`}>
                  <TableCell className="font-medium">{bill.billNo}</TableCell>
                  {user.role !== "member" && (
                    <TableCell>
                      {bill.houseNo} - {bill.ownerName}
                    </TableCell>
                  )}
                  <TableCell>{bill.billingPeriod}</TableCell>
                  <TableCell>{bill.unitsUsed} หน่วย</TableCell>
                  <TableCell>{money(bill.totalAmount)}</TableCell>
                  <TableCell>{thaiDate(bill.dueDate)}</TableCell>
                  <TableCell>{billBadge(bill.displayStatus || bill.status)}</TableCell>

                  {user.role === "admin" && (
                    <TableCell className="text-right">
                      {/* ส่วนที่ 3.4: ปุ่มแก้ไข/ยกเลิก — แสดงเฉพาะบิลที่ยังไม่มีการชำระเงินเข้ามา */}
                      {isBillEditable(bill) && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={saveState === "saving"}
                            onClick={() => {
                              setEditTarget(bill);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={saveState === "saving"}
                            onClick={() => {
                              setCancelTarget(bill);
                              setCancelOpen(true);
                            }}
                          >
                            <Ban className="mr-1 h-4 w-4" />
                            ยกเลิก
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {bills.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={user.role === "admin" ? 8 : 7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ยังไม่มีบิลในระบบ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
