"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { api, money, thaiDate } from "@/lib/api";
import type { Bill, Member } from "@/types";
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

  async function loadData() {
    try {
      setError("");
      const billData = await api<Bill[]>("listBills");
      setBills(billData);

      if (user.role !== "member") {
        setMembers(await api<Member[]>("listMembers"));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // เก็บ ref ไว้ก่อน await
    const form = new FormData(formElement);

    try {
      await api("createBill", {
        memberId: form.get("memberId"),
        billingPeriod: form.get("billingPeriod"),
        currentMeter: Number(form.get("currentMeter")),
        dueDate: form.get("dueDate"),
        note: form.get("note"),
      });

      setOpen(false);
      formElement.reset();
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "ออกบิลไม่สำเร็จ");
    }
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                ออกบิลค่าน้ำ
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ออกบิลค่าน้ำใหม่</DialogTitle>
              </DialogHeader>

              <form onSubmit={createBill} className="space-y-4">
                <div className="space-y-2">
                  <Label>ลูกบ้าน</Label>
                  <Select name="memberId" required>
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
                  <Input name="currentMeter" type="number" min="0" required />
                </div>

                <div className="space-y-2">
                  <Label>วันครบกำหนดชำระ</Label>
                  <Input name="dueDate" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea name="note" placeholder="ถ้ามี" />
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                  ยืนยันการออกบิล
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.billId}>
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
                </TableRow>
              ))}

              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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