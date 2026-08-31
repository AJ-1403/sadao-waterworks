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
    active: boolean | string;
};

export type Staff = {
    staffId: string;
    username: string;
    fullName: string;
    position: string;
    phone: string;
    active: boolean | string;
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