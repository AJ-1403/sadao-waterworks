# CHANGELOG_AI

บันทึกการเปลี่ยนแปลงทั้งหมดที่ AI ทำกับโปรเจกต์นี้ (อัปเดตต่อเนื่อง)

## 2026-09-01 (งานรอบนี้: ฟีเจอร์จัดการบิล/ชำระเงิน, Batch Billing, Audit Log Viewer, Staff Permissions, Export CSV, Dashboard staff)

### เพิ่มใหม่ (Added)
- **Action `cancelBill`** (admin only) — Code.gs: ยกเลิกบิล (billId + reason required), ห้ามยกเลิกบิลที่มี paidAmount > 0 (ต้อง voidPayment ก่อน), เก็บ reason ต่อท้าย field note, logAudit_ "CANCEL_BILL"
- **Action `voidPayment`** (admin only + permission "payments") — Code.gs: ยกเลิกการชำระเงิน (paymentId + reason required), ลด paidAmount ของบิลและปรับ status กลับ unpaid, mark การชำระด้วยคอลัมน์ใหม่ `voided` (ไม่ลบแถว — รักษาประวัติ), logAudit_ "VOID_PAYMENT"
- **Action `editBill`** (admin only) — Code.gs: แก้บิลที่ paidAmount = 0 เท่านั้น (currentMeter, dueDate, note) พร้อมคำนวณยอดใหม่ด้วย calculateWaterCharge_, logAudit_ "EDIT_BILL"
- **Action `createBillsBatch`** (admin, staff + permission "bills") — Code.gs: ออกบิลยกชุดภายใต้ withLock_ เดียว, รายการไหน error ข้ามแล้วทำต่อ, return { success, failed } — ไม่ throw ทั้ง batch
- **Action `listAuditLogs`** (admin only) — Code.gs: filter startDate/endDate/action/userId, sort ใหม่→เก่า, limit default 200 + offset
- **Action `exportBills` / `exportPayments`** (admin, staff) — Code.gs: ข้อมูลดิบไม่จำกัด limit สำหรับ export
- **ฟังก์ชัน `requirePermission_(context, permission)`** — Code.gs: เช็คสิทธิ์ละเอียดของ staff (bills, payments) — admin ผ่านเสมอ
- **ฟังก์ชัน `migrateColumns_()`** — Code.gs: migration คอลัมน์ใหม่ (Payments.voided, Staff.permissions) เติม header + default ให้ชีตเก่า (รันครั้งเดียว หรือรันอัตโนมัติผ่าน setupSystem)
- **คอลัมน์ใหม่ `voided` ท้าย SCHEMAS.Payments**, **`permissions` ท้าย SCHEMAS.Staff** (เพิ่มท้ายเท่านั้น)
- **หน้า `/audit-logs`** — src/app/(portal)/audit-logs/page.tsx + src/components/audit-logs-page.tsx (admin only, เพิ่มใน portal-shell.tsx)
- **โหมด "ออกบิลทั้งหมด"** — bills-page.tsx: ตารางลูกบ้าน active + กรอก currentMeter ต่อแถว (แสดงเลขมิเตอร์ครั้งก่อน) + ผลสำเร็จ/ล้มเหลวรายบ้าน
- **ปุ่ม "ยกเลิกบิล" / "แก้ไข"** — bills-page.tsx (admin, เฉพาะบิลที่ทำได้ตามเงื่อนไข) + modal ยืนยัน + ช่องกรอกเหตุผล
- **ปุ่ม "ยกเลิกการชำระเงิน"** — payments-page.tsx (admin) + modal เหตุผล
- **ช่องค้นหาบิล** — bills-page.tsx: debounce 300ms ส่ง houseNo/fullName ให้ backend กรอง
- **Card "งานของฉันวันนี้"** — dashboard-page.tsx (staff): จาก result.myToday ใหม่ใน getDashboard_
- **กราฟแนวโน้ม 12 เดือน + Export CSV** — reports-page.tsx (recharts + papaparse)
- **Checkbox สิทธิ์พนักงาน** — staff-page.tsx (bills / payments)
- **Field `lastMeterReading`** — publicMember_ (Code.gs) + types/index.ts + bills-page.tsx

### แก้ไข (Changed)
- `dispatchAction_` (Code.gs): เพิ่ม routing ใหม่ 7 action; createBill/recordPayment เปลี่ยนเป็น requireRole_ + requirePermission_ (backward compatible — พนักงานเก่าได้ "all" จาก migration)
- `listBills_` (Code.gs): รับ filter เพิ่ม houseNo, fullName (partial, case-insensitive) กรองฝั่ง backend
- `listMembers_`/`publicMember_` (Code.gs): คำนวณ lastMeterReading จาก Bills ที่อ่านแล้ว (ไม่เพิ่ม round-trip)
- `getDashboard_` (Code.gs): เพิ่ม result.myToday สำหรับ staff (ไม่กระทบ member/admin เดิม)
- `listPayments_` (Code.gs): กรองรายการ voided ออกจาก list ปกติ (ยังอยู่ในชีตและ export)

### ประสิทธิภาพ (Performance)
- createBillsBatch ใช้ withLock_ เดียว + อ่าน members/bills/rates รอบเดียว — ออกบิล 50 บ้าน ~2-4s (เทียบทีละใบ ~100-450s)
- (รอบก่อน) createBill_ อ่าน Bills 3→1 รอบ, CacheService TTL 300s, counter แทนสแกนทั้งตาราง — POST /api/gas คาดลดจาก 2.5-9.4s → ~1-3s (ครั้งแรก) / ~0.3-1s (cache hit)

### สิ่งที่ต้องตั้งค่าเอง (Manual steps required)
1. ก็อป Code.gs.txt ทั้งไฟล์ → Apps Script editor → รันฟังก์ชัน **`migrateColumns_()` 1 ครั้ง** (เติม header คอลัมน์ใหม่ + permissions="all" ให้พนักงานเก่า) → Deploy > Manage deployments > Edit > **New version** > Deploy
2. Trigger วันละครั้ง: รัน `setupDailyMaintenanceTrigger()` ครั้งเดียว (cleanupExpiredSessions_)
3. ติดตั้ง dependency: `npm install papaparse @types/papaparse` (frontend)
4. เช็ค Script Properties: API_KEY, ADMIN_PASSWORD ยังอยู่ครบ

### คำเตือน/ความเสี่ยง (Known risks)
- **cancelBill/voidPayment กระทบข้อมูลการเงินโดยตรง** — ต้องทดสอบก่อนใช้จริง: voidPayment แล้ว paidAmount/status ของบิลต้องถูกต้อง, รายการที่ void ไม่แสดงใน listPayments ปกติ (แต่ยังอยู่ในชีตและ export)
- **จุดเสี่ยงสูงสุด:** ถ้าไม่รัน `migrateColumns_()` พนักงานเก่าจะถูกมองว่าไม่มีสิทธิ์ (permissions ว่าง → โดนบล็อก createBill/recordPayment)
- editBill คำนวณยอดใหม่จากเรทตอน "แก้" ไม่ใช่ตอน "ออกบิล" ถ้าเรทเปลี่ยนระหว่างกลาง
- createBillsBatch ล็อกนานถ้าบ้านเยอะ (waitLock 30s) — batch >200 บ้าน ให้แบ่งเป็นหลาย batch

---

## 2026-09-01 (รอบก่อน: Performance + Idempotency)

### เพิ่มใหม่ (Added)
- CacheService layer (TTL 300s) สำหรับ Members, Staff, Settings, WaterRates, BankAccounts, Users (key "tbl_"+sheetName) + `invalidateCache_()` — Code.gs
- Idempotency key ใน createBill_ (เช็คนอก withLock_, เขียนผลลัพธ์ TTL 120s ข้างใน) — Code.gs + bills-page.tsx (crypto.randomUUID ต่อ 1 รอบการเปิดฟอร์ม)
- Login rate limiting: ผิด 5 ครั้ง/15 นาที ต่อ username ผ่าน CacheService — Code.gs
- Timing instrumentation `GAS_TIMING action=... elapsedMs=...` ใน doPost — Code.gs
- cleanupExpiredSessions_ + setupDailyMaintenanceTrigger() (trigger วันละครั้ง) — Code.gs
- SaveState + กัน double-submit + success/error banner ทุกฟอร์ม — bills/payments/members/staff/settings-page.tsx
- loading.tsx skeletons — /members, /staff, /reports, /settings
- Promise.all ยิง request พร้อมกันใน loadData ของ bills-page และ payments-page

### แก้ไข (Changed)
- ลบ `force-dynamic` จาก (portal)/layout.tsx; auth.ts cache getMyProfile ต่อ token 30s
- allObjects_: 3 ชั้น (memo → CacheService → Sheets API) + invalidate หลังเขียน; ensureSheet_ เช็ค header ครั้งแรกต่อ execution; openById cache
- generateBillNo_/generatePaymentNo_: counter ใน Settings (SEQ_*) ภายใต้ withLock_
- createBill_/recordPayment_: อ่านแต่ละ sheet ครั้งเดียวต่อ request
- error บิลซ้ำระบุเลขบิลเดิม; getActiveRates_ fallback เรท active เก่าสุด (แก้ "ไม่พบเรทค่าน้ำ" ตอนออกบิลรอบย้อนหลัง)
- React row keys fallback กัน key ซ้ำ; LOGIN_LOCK_SECONDS 600→900

### ประสิทธิภาพ (Performance)
- createBill_: อ่าน Bills 3→1 รอบ (~เร็วขึ้น 2-3 เท่าใน action นี้); ออกเลขบิล O(1) แทน O(n)
- POST /api/gas คาดลด 2.5-9.4s → ~1-3s (ครั้งแรก) / ~0.3-1s (cache hit)

### สิ่งที่ต้องตั้งค่าเอง (Manual steps required)
- Deploy Web App เวอร์ชันใหม่; ตั้ง Trigger cleanupExpiredSessions_ > Day timer

### คำเตือน/ความเสี่ยง (Known risks)
- CacheService stale สูงสุด 5 นาที หากแก้ข้อมูลตรงใน Sheet; Members >100KB เกินลิมิต cache (มี fallback); Idempotency TTL 120s (retry หลัง 2 นาทีอาศัย duplicate check ชั้นที่ 2)
