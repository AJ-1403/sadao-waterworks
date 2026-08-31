import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callGas } from "@/lib/gas";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ action" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "กรุณาเข้าสู่ระบบใหม่" },
        { status: 401 }
      );
    }

    const data = await callGas(action, {
      ...payload,
      token,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 400 }
    );
  }
}
