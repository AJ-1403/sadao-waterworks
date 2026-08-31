"use client";

import { forwardRef } from "react";
import { money, thaiDate } from "@/lib/api";
import type { Receipt } from "@/types";

export const ReceiptDocument = forwardRef<
  HTMLDivElement,
  { receipt: Receipt }
>(function ReceiptDocument({ receipt }, ref) {
  const { bill, village } = receipt;

  return (
    <div
      ref={ref}
      className="mx-auto w-[210mm] bg-white p-10 text-slate-900 print:w-full print:p-6"
    >
      <div className="border-b-2 border-slate-900 pb-5 text-center">
        <h1 className="text-2xl font-bold">{village.villageName}</h1>
        <p className="mt-1 text-sm">{village.villageAddress}</p>
        <p className="text-sm">โทร. {village.villagePhone}</p>
        <h2 className="mt-4 text-xl font-bold">ใบเสร็จรับเงิน</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 py-5 text-sm">
        <div>
          <p>
            <span className="font-semibold">เลขที่ใบเสร็จ:</span>{" "}
            {receipt.receiptNo}
          </p>
          <p>
            <span className="font-semibold">วันที่รับชำระ:</span>{" "}
            {thaiDate(receipt.paidAt)}
          </p>
        </div>
        <div className="text-right">
          <p>
            <span className="font-semibold">เลขที่บิล:</span> {bill.billNo}
          </p>
          <p>
            <span className="font-semibold">รอบบิล:</span> {bill.billingPeriod}
          </p>
        </div>
      </div>

      <div className="rounded-md border p-4 text-sm">
        <p>
          <span className="font-semibold">ผู้ใช้น้ำ:</span> {bill.ownerName}
        </p>
        <p>
          <span className="font-semibold">บ้านเลขที่:</span> {bill.houseNo}
        </p>
        <p>
          <span className="font-semibold">เลขมิเตอร์:</span>{" "}
          {bill.previousMeter} - {bill.currentMeter}
        </p>
        <p>
          <span className="font-semibold">ปริมาณใช้น้ำ:</span> {bill.unitsUsed} หน่วย
        </p>
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">รายการ</th>
            <th className="border p-2 text-right">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">ค่าน้ำประปา</td>
            <td className="border p-2 text-right">{money(bill.waterAmount)}</td>
          </tr>
          <tr>
            <td className="border p-2">ค่าบริการ</td>
            <td className="border p-2 text-right">{money(bill.serviceFee)}</td>
          </tr>
          <tr>
            <td className="border p-2">ภาษีมูลค่าเพิ่ม</td>
            <td className="border p-2 text-right">{money(bill.vatAmount)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border p-2">รวมทั้งสิ้น</td>
            <td className="border p-2 text-right">{money(receipt.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
        <div>
          <div className="mb-10 border-b border-slate-900" />
          <p>ผู้ชำระเงิน</p>
        </div>
        <div>
          <div className="mb-10 border-b border-slate-900" />
          <p>{receipt.receivedByName}</p>
          <p>ผู้รับเงิน</p>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        เอกสารฉบับนี้สร้างจากระบบประปาหมู่บ้าน
      </p>
    </div>
  );
});