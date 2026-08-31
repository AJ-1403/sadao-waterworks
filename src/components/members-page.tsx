"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Member } from "@/types";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MembersPage() {
  const user = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function loadMembers() {
    try {
      setError("");
      setMembers(await api<Member[]>("listMembers"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await api("createMember", {
        houseNo: form.get("houseNo"),
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        address: form.get("address"),
        initialMeter: Number(form.get("initialMeter") || 0),
        password: form.get("password"),
      });

      setOpen(false);
      event.currentTarget.reset();
      await loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "เพิ่มลูกบ้านไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลลูกบ้าน</h1>
          <p className="text-sm text-muted-foreground">จัดการข้อมูลผู้ใช้น้ำในหมู่บ้าน</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMembers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            รีเฟรช
          </Button>

          {user.role === "admin" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มลูกบ้าน
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>เพิ่มข้อมูลลูกบ้าน</DialogTitle>
                </DialogHeader>

                <form onSubmit={createMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label>บ้านเลขที่</Label>
                    <Input name="houseNo" placeholder="เช่น 101" required />
                  </div>
                  <div className="space-y-2">
                    <Label>ชื่อ-นามสกุล</Label>
                    <Input name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label>เบอร์โทรศัพท์</Label>
                    <Input name="phone" type="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label>ที่อยู่</Label>
                    <Input name="address" />
                  </div>
                  <div className="space-y-2">
                    <Label>เลขมิเตอร์เริ่มต้น</Label>
                    <Input name="initialMeter" type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>รหัสผ่านสำหรับลูกบ้าน</Label>
                    <Input name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                    บันทึกข้อมูล
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ลูกบ้านทั้งหมด ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>เลขมิเตอร์เริ่มต้น</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.memberId}>
                  <TableCell className="font-medium">{member.houseNo}</TableCell>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>{member.phone || "-"}</TableCell>
                  <TableCell>{member.initialMeter}</TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    ยังไม่มีข้อมูลลูกบ้าน
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
