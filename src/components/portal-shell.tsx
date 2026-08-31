"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  Droplets,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import type { Role, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
};

const menuItems: MenuItem[] = [
  {
    href: "/dashboard",
    label: "ภาพรวม",
    icon: LayoutDashboard,
    roles: ["admin", "staff", "member"],
  },
  {
    href: "/members",
    label: "ลูกบ้าน",
    icon: Users,
    roles: ["admin", "staff"],
  },
  {
    href: "/staff",
    label: "พนักงาน",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    href: "/bills",
    label: "บิลค่าน้ำ",
    icon: ClipboardList,
    roles: ["admin", "staff", "member"],
  },
  {
    href: "/payments",
    label: "รับชำระเงิน",
    icon: WalletCards,
    roles: ["admin", "staff", "member"],
  },
  {
    href: "/reports",
    label: "รายงาน",
    icon: BarChart3,
    roles: ["admin", "staff"],
  },
  {
    href: "/settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
    roles: ["admin"],
  },
];

function roleLabel(role: Role) {
  if (role === "admin") return "ผู้ดูแลระบบ";
  if (role === "staff") return "เจ้าหน้าที่";
  return "ลูกบ้าน";
}

function Navigation({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {menuItems
        .filter((item) => item.roles.includes(user.role))
        .map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-teal-600 text-white"
                  : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

export function PortalShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 hidden w-64 border-r bg-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b px-6">
          <div className="rounded-xl bg-teal-600 p-2 text-white">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold">ประปาสะเดาพัฒนา</p>
            <p className="text-xs text-muted-foreground">Waterworks System</p>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)] flex-col p-4">
          <Navigation user={user} />

          <div className="mt-auto border-t pt-4">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="mb-3 text-xs text-muted-foreground">{roleLabel(user.role)}</p>
            <Button variant="outline" className="w-full justify-start" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2 font-bold text-teal-700">
          <Droplets className="h-5 w-5" />
          ประปาสะเดาพัฒนา
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <div className="mb-6 flex items-center gap-2 font-bold text-teal-700">
              <Droplets className="h-6 w-6" />
              ประปาสะเดาพัฒนา
            </div>
            <Navigation user={user} />
            <div className="mt-6 border-t pt-4">
              <p className="font-semibold">{user.fullName}</p>
              <p className="mb-3 text-sm text-muted-foreground">{roleLabel(user.role)}</p>
              <Button variant="outline" className="w-full" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="p-4 lg:ml-64 lg:p-8">{children}</main>
    </div>
  );
}
