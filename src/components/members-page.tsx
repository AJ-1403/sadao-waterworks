"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Plus, Power, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Member } from "@/types";
import { useUser } from "@/components/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function isActive(value: boolean | string) {
  return value === true || value === "true" || value === "TRUE";
}

/* ข้อ 2.4: SaveState รวมสถานะของ mutation — idle/saving/success/error */
type SaveState = "idle" | "saving" | "success" | "error";

export function MembersPage() {
  const user = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  // ข้อ ใช้ state เดียวร่วมกันทุกฟอร์ม/ปุ่มในหน้านี้ (createMember, updateMember, toggleMemberStatus)
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* ข้อ 2.4: แสดงข้อความสำเร็จค้างไว้ 2.5 วินาทีแล้วกลับสู่ idle */
  function flashSuccess(text: string) {
    setSaveState("success");
    setMessage(text);

    setTimeout(() => {
      setSaveState("idle");
      setMessage("");
    }, 2500);
  }

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

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return members;

    return members.filter((member) =>
      [member.houseNo, member.fullName, member.phone]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [members, search]);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // เก็บ ref ไว้ก่อน await (React ทำ currentTarget เป็น null หลัง async)
    const form = new FormData(formElement);

    // ข้อ 2.5: กัน double-submit
    if (saveState === "saving") return;

    setSaveState("saving");

    try {
      await api("createMember", {
        houseNo: form.get("houseNo"),
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        address: form.get("address"),
        initialMeter: Number(form.get("initialMeter") || 0),
        password: form.get("password"),
      });

      formElement.reset();
      setCreateOpen(false);
      flashSuccess("เพิ่มข้อมูลลูกบ้านสำเร็จ");
      await loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "เพิ่มลูกบ้านไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  async function updateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMember || saveState === "saving") return;

    const form = new FormData(event.currentTarget);

    setSaveState("saving");

    try {
      await api("updateMember", {
        memberId: selectedMember.memberId,
        houseNo: form.get("houseNo"),
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        address: form.get("address"),
        initialMeter: Number(form.get("initialMeter") || 0),
        password: form.get("password") || undefined,
      });

      setEditOpen(false);
      setSelectedMember(null);
      flashSuccess("บันทึกข้อมูลลูกบ้านสำเร็จ");
      await loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "แก้ไขข้อมูลไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  async function toggleStatus(member: Member) {
    const active = isActive(member.active);
    const confirmed = window.confirm(
      active
        ? `ต้องการปิดใช้งานบ้านเลขที่ ${member.houseNo} ใช่หรือไม่?`
        : `ต้องการเปิดใช้งานบ้านเลขที่ ${member.houseNo} ใช่หรือไม่?`
    );

    if (!confirmed || saveState === "saving") return;

    setSaveState("saving");

    try {
      await api("toggleMemberStatus", {
        memberId: member.memberId,
        active: !active,
      });

      flashSuccess("เปลี่ยนสถานะลูกบ้านสำเร็จ");
      await loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ");
      setSaveState("error");
    } finally {
      setSaveState((state) => (state === "saving" ? "idle" : state));
    }
  }

  function openEdit(member: Member) {
    setSelectedMember(member);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">ข้อมูลลูกบ้าน</h1>
          <p className="text-sm text-muted-foreground">
            จัดการข้อมูลผู้ใช้น้ำในหมู่บ้าน
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadMembers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            รีเฟรช
          </Button>

          {user.role === "admin" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                    <Input
                      name="initialMeter"
                      type="number"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>รหัสผ่านสำหรับลูกบ้าน</Label>
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
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ข้อ 2.4: แสดงข้อความสำเร็จ (inline แทน toast library) */}
      {saveState === "success" && message && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">
            ลูกบ้านทั้งหมด ({filteredMembers.length})
          </CardTitle>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="ค้นหาบ้านเลขที่, ชื่อ, เบอร์โทร"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>บ้านเลขที่</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>เบอร์โทร</TableHead>
                <TableHead>เลขมิเตอร์เริ่มต้น</TableHead>
                <TableHead>สถานะ</TableHead>
                {user.role === "admin" && (
                  <TableHead className="text-right">จัดการ</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMembers.map((member, index) => {
                const active = isActive(member.active);

                return (
                  <TableRow key={member.memberId || `row-${index}`}>
                    <TableCell className="font-medium">
                      {member.houseNo}
                    </TableCell>
                    <TableCell>{member.fullName}</TableCell>
                    <TableCell>{member.phone || "-"}</TableCell>
                    <TableCell>{member.initialMeter}</TableCell>
                    <TableCell>
                      {active ? (
                        <Badge className="bg-emerald-600">ใช้งาน</Badge>
                      ) : (
                        <Badge variant="secondary">ปิดใช้งาน</Badge>
                      )}
                    </TableCell>

                    {user.role === "admin" && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(member)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            แก้ไข
                          </Button>
                          <Button
                            variant={active ? "destructive" : "secondary"}
                            size="sm"
                            disabled={saveState === "saving"}
                            onClick={() => toggleStatus(member)}
                          >
                            <Power className="mr-1 h-4 w-4" />
                            {active ? "ปิดใช้" : "เปิดใช้"}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}

              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={user.role === "admin" ? 6 : 5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ไม่พบข้อมูลลูกบ้าน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              แก้ไขข้อมูลบ้านเลขที่ {selectedMember?.houseNo}
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <form onSubmit={updateMember} className="space-y-4">
              <div className="space-y-2">
                <Label>บ้านเลขที่</Label>
                <Input
                  name="houseNo"
                  defaultValue={selectedMember.houseNo}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล</Label>
                <Input
                  name="fullName"
                  defaultValue={selectedMember.fullName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทรศัพท์</Label>
                <Input name="phone" defaultValue={selectedMember.phone} />
              </div>
              <div className="space-y-2">
                <Label>ที่อยู่</Label>
                <Input name="address" defaultValue={selectedMember.address} />
              </div>
              <div className="space-y-2">
                <Label>เลขมิเตอร์เริ่มต้น</Label>
                <Input
                  name="initialMeter"
                  type="number"
                  min="0"
                  defaultValue={selectedMember.initialMeter}
                />
              </div>
              <div className="space-y-2">
                <Label>รหัสผ่านใหม่</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                />
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
    </div>
  );
}