export type Role = "admin" | "staff" | "member";

export type User = {
    userId: string;
    username: string;
    role: Role;
    fullName: string;
    memberId?: string;
    staffId?: string;
};

export type Member = {
    memberId: string;
    houseNo: string;
    fullName: string;
    phone: string;
    address: string;
    initialMeter: number;
    // ส่วนที่ 6.2: เลขมิเตอร์ครั้งก่อน (จากบิลล่าสุดที่ไม่ cancelled, fallback = initialMeter)
    lastMeterReading: number;
    active: boolean | string;
};

export type Staff = {
    staffId: string;
    username: string;
    fullName: string;
    position: string;
    phone: string;
    active: boolean | string;
    // ส่วนที่ 7.4: สิทธิ์พนักงาน — "all" | "bills,payments" | "" (ยังไม่ migrate)
    permissions?: string;
};

export type Bill = {
    billId: string;
    billNo: string;
    memberId: string;
    houseNo: string;
    ownerName: string;
    billingPeriod: string;
    previousMeter: number;
    currentMeter: number;
    unitsUsed: number;
    waterAmount: number;
    serviceFee: number;
    vatAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount?: number;
    status: "unpaid" | "paid" | "cancelled";
    displayStatus?: "unpaid" | "paid" | "overdue" | "cancelled";
    dueDate: string;
    note: string;
    createdAt: string;
};

export type Payment = {
    paymentId: string;
    paymentNo: string;
    billId: string;
    billNo: string;
    houseNo: string;
    ownerName: string;
    amount: number;
    paymentMethod: "cash" | "transfer";
    paymentNote: string;
    paidAt: string;
    receivedByName: string;
};

export type DashboardData = {
    role: Role;
    summary: {
        totalWaterAmount: number;
        totalPaidAmount: number;
        totalOutstanding: number;
        totalBills: number;
        totalMembers?: number;
        totalStaff?: number;
    };
    monthlySummary: {
        billingPeriod: string;
        totalUnits: number;
        totalAmount: number;
        paidAmount: number;
        outstandingAmount: number;
    }[];
    latestBill?: Bill | null;
    member?: Member;
    // ส่วนที่ 8.2: สรุปงานของ staff วันนี้ (มีเฉพาะเมื่อ role = staff)
    myToday?: {
        billsCreatedToday: number;
        paymentsReceivedToday: number;
        amountReceivedToday: number;
    };
};

// ส่วนที่ 4.2: ผลลัพธ์ของ createBillsBatch (success/failed ต่อรายการ)
export type BatchBillingResult = {
    billingPeriod: string;
    created: number;
    success: {
        memberId: string;
        houseNo: string;
        fullName: string;
        billId: string;
        billNo: string;
        totalAmount: number;
    }[];
    failed: {
        memberId: string;
        reason: string;
    }[];
    message: string;
};

// ส่วนที่ 5.2: ข้อมูล audit log สำหรับหน้า /audit-logs
export type AuditLogEntry = {
    logId: string;
    action: string;
    userId: string;
    username: string;
    role: string;
    targetType: string;
    targetId: string;
    detail: string;
    createdAt: string;
};

export type AuditLogsResponse = {
    total: number;
    limit: number;
    offset: number;
    logs: AuditLogEntry[];
};

export type PaymentChannel = {
  bankId: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  qrCodeUrl: string;
  active: boolean | string;
};

export type Receipt = {
  receiptNo: string;
  paidAt: string;
  paymentMethod: "cash" | "transfer";
  amount: number;
  receivedByName: string;
  bill: {
    billNo: string;
    billingPeriod: string;
    houseNo: string;
    ownerName: string;
    previousMeter: number;
    currentMeter: number;
    unitsUsed: number;
    waterAmount: number;
    serviceFee: number;
    vatAmount: number;
    totalAmount: number;
  };
  village: {
    villageName: string;
    villageAddress: string;
    villagePhone: string;
  };
};

export type SettingsData = {
  village: Record<string, string>;
    bankAccounts: {
        bankId: string;
        bankName: string;
        accountName: string;
        accountNo: string;
        qrCodeUrl: string;
        active: boolean | string;
    }[];
    waterRates: {
        rateId: string;
        effectiveDate: string;
        rateMode: "flat" | "tiered";
        unitStart: number;
        unitEnd: number | "";
        pricePerUnit: number;
        serviceFee: number;
        vatPercent: number;
    }[];
};