"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SettingsData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [message, setMessage] = useState("");
  /* ข้อ 2.4: SaveState ใช้ร่วมกันทั้ง 3 ฟอร์ม (saveVillageSettings, saveBankAccount,
     saveWaterRates) — เดิมฟอร์มเหล่านี้ไม่มี try/catch เลย error หลุดเป็น unhandled
     และปุ่มกดซ้ำได้ระหว่างรอ response */
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function flashSuccess(text: string) {
    setSaveState("success");
    setMessage(text);

    setTimeout(() => {
      setSaveState("idle");
      setMessage("");
    }, 2500);
  }

  async function loadSettings() {
    try {
      setSettings(await api<SettingsData>("getSettings"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveVillage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // ข้อ 2.5: กัน double-submit
    if (saveState === "saving") return;

    setSaveState("saving");
    setError("");

    try {
      await api("saveVillageSettings", {
        settings: {
          villageName: form.get("villageName"),
          villagePhone: form.get("villagePhone"),
          villageAddress: form.get("villageAddress"),
          paymentDueDays: form.get("paymentDueDays"),
        },
      });

      flashSuccess("บันทึกข้อมูลหมู่บ้านสำเร็จ");
      await loadSettings();
    } catch (error) {
      // ข้อ 2.4: แสดง error จาก response ให้ผู้ใช้เห็น ไม่ fail เงียบ
      setError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  async function saveBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // เก็บ ref ไว้ก่อน await
    const form = new FormData(formElement);

    // ข้อ 2.5: กัน double-submit
    if (saveState === "saving") return;

    setSaveState("saving");
    setError("");

    try {
      await api("saveBankAccount", {
        bankName: form.get("bankName"),
        accountName: form.get("accountName"),
        accountNo: form.get("accountNo"),
        qrCodeUrl: form.get("qrCodeUrl"),
      });

      formElement.reset();
      flashSuccess("เพิ่มข้อมูลบัญชีธนาคารสำเร็จ");
      await loadSettings();
    } catch (error) {
      setError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  async function saveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // ข้อ 2.5: กัน double-submit
    if (saveState === "saving") return;

    setSaveState("saving");
    setError("");

    try {
      await api("saveWaterRates", {
        rates: [
          {
            effectiveDate: form.get("effectiveDate"),
            rateMode: "flat",
            unitStart: 0,
            unitEnd: "",
            pricePerUnit: Number(form.get("pricePerUnit")),
            serviceFee: Number(form.get("serviceFee")),
            vatPercent: Number(form.get("vatPercent")),
          },
        ],
      });

      flashSuccess("บันทึกเรทค่าน้ำสำเร็จ");
      await loadSettings();
    } catch (error) {
      setError(error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  if (!settings) {
    return <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>;
  }

  const rate = settings.waterRates[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-sm text-muted-foreground">จัดการข้อมูลหมู่บ้าน เรทค่าน้ำ และบัญชีรับชำระ</p>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ข้อ 2.4: แสดงข้อความสำเร็จ/สถานะ error (inline แทน toast library) */}
      {saveState === "success" && message && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลหมู่บ้าน</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveVillage} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ชื่อหมู่บ้าน</Label>
              <Input name="villageName" defaultValue={settings.village.villageName} required />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทรศัพท์</Label>
              <Input name="villagePhone" defaultValue={settings.village.villagePhone} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ที่อยู่</Label>
              <Input name="villageAddress" defaultValue={settings.village.villageAddress} />
            </div>
            <div className="space-y-2">
              <Label>จำนวนวันก่อนครบกำหนดชำระ</Label>
              <Input
                name="paymentDueDays"
                type="number"
                min="1"
                defaultValue={settings.village.paymentDueDays || "15"}
              />
            </div>
            <div className="flex items-end">
              <Button
                disabled={saveState === "saving"}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {/* ข้อ 2.4/2.5: disable ระหว่าง saving กัน double-submit */}
                {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลหมู่บ้าน"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เรทค่าน้ำและภาษี</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveRate} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>วันที่เริ่มใช้</Label>
              <Input name="effectiveDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
            <div className="space-y-2">
              <Label>ค่าน้ำต่อหน่วย</Label>
              <Input name="pricePerUnit" type="number" step="0.01" defaultValue={rate?.pricePerUnit || 5} required />
            </div>
            <div className="space-y-2">
              <Label>ค่าบริการ</Label>
              <Input name="serviceFee" type="number" step="0.01" defaultValue={rate?.serviceFee || 10} required />
            </div>
            <div className="space-y-2">
              <Label>VAT (%)</Label>
              <Input name="vatPercent" type="number" step="0.01" defaultValue={rate?.vatPercent || 7} required />
            </div>
            <Button
              disabled={saveState === "saving"}
              className="w-fit bg-teal-600 hover:bg-teal-700"
            >
              {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "บันทึกเรทค่าน้ำ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มบัญชีธนาคาร / QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveBank} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ธนาคาร</Label>
              <Input name="bankName" placeholder="เช่น ธนาคารกรุงไทย" required />
            </div>
            <div className="space-y-2">
              <Label>ชื่อบัญชี</Label>
              <Input name="accountName" required />
            </div>
            <div className="space-y-2">
              <Label>เลขบัญชี</Label>
              <Input name="accountNo" required />
            </div>
            <div className="space-y-2">
              <Label>ลิงก์รูป QR Code</Label>
              <Input name="qrCodeUrl" placeholder="https://..." />
            </div>
            <Button
              disabled={saveState === "saving"}
              className="w-fit bg-teal-600 hover:bg-teal-700"
            >
              {saveState === "saving" ? "กำลังบันทึกข้อมูล..." : "เพิ่มบัญชีธนาคาร"}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            {settings.bankAccounts.map((bank) => (
              <div key={bank.bankId} className="rounded-lg border p-3">
                <p className="font-semibold">{bank.bankName}</p>
                <p className="text-sm text-muted-foreground">
                  {bank.accountName} — {bank.accountNo}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}