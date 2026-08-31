/* ข้อ 2.3: loading skeleton สำหรับหน้า /members
   หมายเหตุ: หน้านี้เป็น Server Component ที่เรียก requireRole ก่อน — loading.tsx ทำให้
   Next.js แสดง skeleton ทันทีระหว่างรอ RSC render แทนหน้าขาว/ค้าง
   (ข้อมูลจริงของหน้ายังโหลดใน client หลัง hydration ซึ่งมี loading state ของตัวเอง) */
export default function MembersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-72 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="ml-auto h-4 w-14 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}