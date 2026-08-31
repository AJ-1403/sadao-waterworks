/* ข้อ 2.3: loading skeleton สำหรับหน้า /settings — แสดงทันทีระหว่างรอ RSC render
   (log production พบว่าหน้านี้ใช้เวลา 6.0s ซึ่งเป็นเวลารอ requireRole → callGas ไป GAS) */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-white p-6">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-9 animate-pulse rounded bg-slate-100" />
            <div className="h-9 animate-pulse rounded bg-slate-100" />
            <div className="h-9 animate-pulse rounded bg-slate-100" />
            <div className="h-9 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}