import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { callGas } from "@/lib/gas";
import type { Role, User } from "@/types";

const COOKIE_NAME = "sadao_water_session";

type ProfileResponse = {
  user: User;
};

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const profile = await callGas<ProfileResponse>("getMyProfile", { token });
    return profile.user;
  } catch {
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
