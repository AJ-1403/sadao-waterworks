"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CreditCard, Plus, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { api, money, thaiDate } from "@/lib/api";
import type { Bill, Payment, Receipt } from "@/types";
import { useUser } from "@/components/providers";
import { ReceiptDocument } from "@/components/receipt-document";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export function PaymentsPage() {
  const user = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receipt ? `ใบเสร็จ-${receipt.receiptNo}` : "ใบเสร็จรับเงิน",
  });

  async function printReceipt(paymentId: string) {
    try {
      const data = await api<Receipt>("getReceipt", { paymentId });

      setReceipt(data);

      setTimeout(() => {
        handlePrint();
      }, 150);
    } catch (error) {
      setError(error instanceof Error ? error.message : "ไม่สามารถสร้างใบเสร็จได้");
    }
  }

  async function loadData() {
    try {
      setPayments(await api<Payment[]>("listPayments"));

      if (user.role !== "member") {
        setUnpaidBills(await api<Bill[]>("listBills", { status: "unpaid" }));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // เก็บ ref ไว้ก่อน await
    const form = new FormData(formElement);

    try {
      await api("recordPayment", {
        billId: form.get("billId"),
        amount: Number(form.get("amount")),
        paymentMethod: form.get("paymentMethod"),
        paymentNote: form.get("paymentNote"),
      });

      setOpen(false);
      formElement.reset();
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "บันทึกการชำระเงินไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {user.role === "member" ? "ประวัติการชำระเงิน" : "รับชำระเงิน"}
          </h1>
          <p className="text-sm text-muted-foreground">
            ตรวจสอบรายการรับเงินสดและการโอนเงิน
          </p>
        </div>

        {user.role !== "member" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                บันทึกรับชำระ
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>รับชำระเงิน</DialogTitle>
              </DialogHeader>

              <form onSubmit={recordPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>เลือกบิล</Label>
                  <Select name="billId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบิลค้างชำระ" />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidBills.map((bill) => (
                        <SelectItem key={bill.billId} value={bill.billId}>
                          {bill.billNo} | บ้าน {bill.houseNo} | {money(bill.remainingAmount || bill.totalAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>จำนวนเงิน</Label>
                  <Input name="amount" type="number" min="0.01" step="0.01" required />
                </div>

                <div className="space-y-2">
                  <Label>วิธีชำระเงิน</Label>
                  <Select name="paymentMethod" defaultValue="cash">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">เงินสด</SelectItem>
                      <SelectItem value="transfer">โอนเงิน / QR Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea name="paymentNote" placeholder="เช่น เลขอ้างอิงการโอน" />
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                  บันทึกการชำระเงิน
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
            <CreditCard className="h-5 w-5 text-teal-600" />
            รายการชำระเงิน
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่รับเงิน</TableHead>
                <TableHead>เลขบิล</TableHead>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>วิธีชำระ</TableHead>
                <TableHead>วันที่รับเงิน</TableHead>
                <TableHead className="text-right">ใบเสร็จ</TableHead>
                {user.role !== "member" && <TableHead>ผู้รับเงิน</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.paymentId}>
                  <TableCell>{payment.paymentNo}</TableCell>
                  <TableCell>{payment.billNo}</TableCell>
                  <TableCell>{payment.houseNo}</TableCell>
                  <TableCell className="font-medium">{money(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.paymentMethod === "cash" ? "เงินสด" : "โอนเงิน"}
                  </TableCell>
                  <TableCell>{thaiDate(payment.paidAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printReceipt(payment.paymentId)}
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      พิมพ์
                    </Button>
                  </TableCell>
                  {user.role !== "member" && <TableCell>{payment.receivedByName}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="hidden">
        {receipt && <ReceiptDocument ref={receiptRef} receipt={receipt} />}
      </div>
    </div>
  );
}