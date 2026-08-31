/* ข้อ 2.3: loading skeleton สำหรับหน้า /staff — แสดงทันทีระหว่างรอ RSC render */
export default function StaffLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}