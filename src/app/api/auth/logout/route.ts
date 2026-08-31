import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callGas } from "@/lib/gas";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (token) {
      await callGas("logout", { token });
    }
  } catch {
    // ล้าง Cookie ต่อ แม้ Apps Script ตอบกลับผิดพลาด
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
