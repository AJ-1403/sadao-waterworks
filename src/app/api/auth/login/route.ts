import { NextResponse } from "next/server";
import { callGas } from "@/lib/gas";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ Username และ Password" },
        { status: 400 }
      );
    }

    const result = await callGas<{
      token: string;
      expiresInDays: number;
      user: unknown;
    }>("login", {
      username,
      password,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.expiresInDays * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ",
      },
      { status: 401 }
    );
  }
}
