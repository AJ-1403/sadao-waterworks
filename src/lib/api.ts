export async function api<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch("/api/gas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "เกิดข้อผิดพลาด");
  }

  return result.data as T;
}

export function money(value: number | string | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function thaiDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(new Date(value));
}
