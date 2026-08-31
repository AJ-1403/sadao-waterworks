type GasResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

const GAS_URL = process.env.GAS_WEB_APP_URL;
const GAS_API_KEY = process.env.GAS_API_KEY;

export async function callGas<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  if (!GAS_URL || !GAS_API_KEY) {
    throw new Error("ยังไม่ได้ตั้งค่า GAS_WEB_APP_URL หรือ GAS_API_KEY");
  }

  const response = await fetch(GAS_URL, {
    method: "POST",
    redirect: "follow",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      apiKey: GAS_API_KEY,
      ...payload,
    }),
  });

  const text = await response.text();

  let result: GasResponse<T>;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("ไม่สามารถอ่านผลลัพธ์จากระบบ Google Apps Script ได้");
  }

  if (!result.success) {
    throw new Error(result.error || "เกิดข้อผิดพลาดจากระบบหลังบ้าน");
  }

  return result.data as T;
}
