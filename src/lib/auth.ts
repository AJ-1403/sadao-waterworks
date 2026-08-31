import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { callGas } from "@/lib/gas";
import type { Role, User } from "@/types";

const COOKIE_NAME = "sadao_water_session";

/*
 * Profile cache: cache ผล getMyProfile ต่อ token สั้น ๆ (30 วินาที)
 * เพื่อไม่ต้องยิง round-trip ไป Google Apps Script/Sheets ทุกครั้งที่ navigate
 * ระหว่างหน้าใน portal (layout.tsx รันใหม่ทุกครั้ง)
 * - logout จะล้าง cache ทันที (revalidate ผ่าน invalidateUserCache)
 * - session ถูกยกเลิกที่ backend จะมีผลช้าสุด 30 วินาที (TTL) — ยอมรับได้
 *   เพราะทุก action จริง (api/gas route) ยังส่ง token ให้ GAS verify เสมอ
 */
const PROFILE_CACHE_TTL_MS = 30_000;
const profileCache = new Map<string, { user: User; cachedAt: number }>();

type ProfileResponse = {
  user: User;
};

export function invalidateUserCache(token?: string) {
  if (token) {
    profileCache.delete(token);
  } else {
    profileCache.clear();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const cached = profileCache.get(token);

  if (cached && Date.now() - cached.cachedAt < PROFILE_CACHE_TTL_MS) {
    return cached.user;
  }

  try {
    const profile = await callGas<ProfileResponse>("getMyProfile", { token });
    profileCache.set(token, { user: profile.user, cachedAt: Date.now() });
    return profile.user;
  } catch {
    profileCache.delete(token);
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
