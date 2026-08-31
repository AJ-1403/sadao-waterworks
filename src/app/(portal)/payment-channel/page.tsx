"use client";

import { useEffect, useState } from "react";
import { Copy, QrCode, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { PaymentChannel } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentChannelPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [message, setMessage] = useState("");

  async function loadChannels() {
    try {
      setChannels(await api<PaymentChannel[]>("getPaymentChannels"));
    } catch {
      setMessage("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
    }
  }

  useEffect(() => {
    loadChannels();
  }, []);

  async function copyAccount(accountNo: string) {
    await navigator.clipboard.writeText(accountNo);
    setMessage("คัดลอกเลขบัญชีแล้ว");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ช่องทางชำระเงิน</h1>
          <p className="text-sm text-muted-foreground">
            สแกน QR Code หรือโอนเงินเข้าบัญชีที่กำหนด
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadChannels}>
          <RefreshCw className="mr-2 h-4 w-4" />
          รีเฟรช
        </Button>
      </div>

      {message && (
        <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-700">
          {message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel) => (
          <Card key={channel.bankId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5 text-teal-600" />
                {channel.bankName}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {channel.qrCodeUrl && (
                <img
                  src={channel.qrCodeUrl}
                  alt={`QR Code ${channel.bankName}`}
                  className="mx-auto aspect-square w-full max-w-56 rounded-lg border object-contain"
                />
              )}

              <div>
                <p className="text-sm text-muted-foreground">ชื่อบัญชี</p>
                <p className="font-semibold">{channel.accountName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">เลขบัญชี</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{channel.accountNo}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyAccount(channel.accountNo)}
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    คัดลอก
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-800">
          หลังโอนเงิน กรุณาติดต่อเจ้าหน้าที่พร้อมแจ้งบ้านเลขที่ รอบบิล
          และหลักฐานการโอน เพื่อให้เจ้าหน้าที่ตรวจสอบและบันทึกการชำระเงิน
        </CardContent>
      </Card>
    </div>
  );
}