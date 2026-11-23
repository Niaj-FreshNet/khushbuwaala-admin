import type { PageMeta } from './api.types';

export type ExpenseStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

/** Prisma Expense + expenseBy (expense.service) */
export interface Expense {
  id: string;
  expenseTime: string;
  amount: number;
  method: string;
  isPaid: boolean;
  title?: string | null;
  description?: string | null;
  reference?: string | null;
  status: ExpenseStatus;
  category?: string | null;
  expenseById?: string | null;
  expenseBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** Totals for every expense matching the filters (not only the page shown) */
export interface ExpenseSummary {
  totalCount: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  dueCount: number;
  dueAmount: number;
}

export interface ExpenseList {
  meta: PageMeta;
  summary?: ExpenseSummary;
  data: Expense[];
}

export type ExpenseListQuery = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  isPaid?: boolean;
  method?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateExpensePayload = {
  expenseTime?: string;
  title: string;
  description?: string;
  amount: number;
  method: string;
  isPaid?: boolean;
  status?: ExpenseStatus;
  reference?: string;
  category?: string;
};
