// Shapes returned by the backend Investor module (investor.service / investorProfit.service / ledgerAccess.service).
// Dates arrive as ISO strings.

export type { ApiEnvelope } from "./api.types";

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface InvestorWithdrawal {
  id: string;
  investorId: string;
  amount: number;
  status: WithdrawalStatus;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  requestDate: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestorMonthlyProfit {
  id: string;
  investorId: string;
  year: number;
  month: number;
  companyNetProfit: number;
  shareAmount: number;
  isDistributed: boolean;
  sharePercentage?: number | null;
  distributedAt?: string | null;
}

export interface InvestorRecord {
  id: string;
  userId: string;
  profitSharePercentage: number;
  totalInvested: number;
  currentBalance: number;
  createdAt: string;
  user: { name: string; email: string; isApproved?: boolean; phone?: string | null };
}

export interface WithdrawalWithInvestor extends InvestorWithdrawal {
  investor: InvestorRecord;
}

export interface InvestorScaledMetrics {
  grossSales: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalFulfillmentCosts: number;
  totalOperatingExpenses: number;
  netProfit: number;
  totalOrderDiscounts: number;
  returnedCourierLoss: number;
}

export interface InvestorDashboard {
  period: { startDate?: string; endDate?: string; [k: string]: unknown };
  investorProfile: {
    name?: string;
    email?: string;
    profitSharePercentage: number;
    totalInvested: number;
    currentBalance: number;
  };
  metrics: InvestorScaledMetrics;
  recentWithdrawals: InvestorWithdrawal[];
  monthlyProfits: InvestorMonthlyProfit[];
}

export interface ProfitPreviewRow {
  investorId: string;
  name?: string;
  email?: string;
  sharePercentage: number;
  proposedShare: number;
  credited: { amount: number; sharePercentage?: number | null; companyNetProfit: number; at?: string | null } | null;
}

export interface ProfitPreview {
  year: number;
  month: number;
  isClosed: boolean;
  companyNetProfit: number;
  isLoss: boolean;
  metrics: { totalRevenue: number; grossProfit: number; totalOperatingExpenses: number; totalFulfillmentCosts: number };
  investors: ProfitPreviewRow[];
  allCredited: boolean;
}

export interface ProfitApproval {
  year: number;
  month: number;
  companyNetProfit: number;
  credited: { investorId: string; amount: number; status: 'credited' }[];
  skipped: { investorId: string; amount: number; status: 'already-credited' }[];
}

export type LedgerAccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LedgerAccessRequest {
  id: string;
  userId: string;
  status: LedgerAccessStatus;
  reason?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
  decidedById?: string | null;
  expiresAt?: string | null;
}

export interface LedgerAccessRequestRow extends LedgerAccessRequest {
  user: { id: string; name: string; email: string } | null;
  approvedThisMonth: number;
  isActive: boolean;
}

export interface MyLedgerAccess {
  hasAccess: boolean;
  expiresAt: string | null;
  pendingRequest: { id: string; requestedAt: string } | null;
  approvedThisMonth: number;
}

/** Fields the Manage Investors form may send (blank = unchanged on the server). */
export type InvestorUpdate = Partial<Pick<InvestorRecord, 'profitSharePercentage' | 'totalInvested' | 'currentBalance'>>;
