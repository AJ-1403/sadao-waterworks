/* ข้อ 2.3: loading skeleton สำหรับหน้า /reports — แสดงทันทีระหว่างรอ RSC render
   (getDashboard อ่านตาราง Bills ทั้งตารางจึงใช้เวลานานตาม log) */
export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="ml-auto h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}