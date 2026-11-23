import baseApi from '../baseApi';
import type { ApiEnvelope } from '@/types/api.types';
import type { CreateExpensePayload, Expense, ExpenseList, ExpenseListQuery, ExpenseStatus } from '@/types/expense.types';

const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addExpense: builder.mutation<ApiEnvelope<Expense>, CreateExpensePayload>({
      query: (body) => ({
        url: '/expenses/create-expense',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
    getAllExpenses: builder.query<ApiEnvelope<ExpenseList>, ExpenseListQuery | void>({
      query: (params) => ({
        url: '/expenses/get-all-expenses',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Expenses'],
    }),
    getExpenseDetails: builder.query<ApiEnvelope<Expense | null>, string>({
      query: (id) => ({
        url: `/expenses/get-expense-by-id/${id}`,
        method: 'GET',
      }),
      providesTags: ['Expenses'],
    }),
    // Status only (the list's quick status change)
    updateExpense: builder.mutation<ApiEnvelope<Expense>, { id: string; status: ExpenseStatus }>({
      query: ({ id, status }) => ({
        url: `/expenses/update-expense-status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
    // Full edit (admins): title, amount, date, method, category, status, paid…
    editExpense: builder.mutation<ApiEnvelope<Expense>, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/expenses/update-expense/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
    getExpenseCategories: builder.query<{ data: { value: string; label: string }[] }, void>({
      query: () => '/expenses/categories',
      keepUnusedDataFor: 3600,
    }),
    deleteExpense: builder.mutation<ApiEnvelope<Expense>, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddExpenseMutation,
  useGetAllExpensesQuery,
  useGetExpenseDetailsQuery,
  useUpdateExpenseMutation,
  useEditExpenseMutation,
  useGetExpenseCategoriesQuery,
  useDeleteExpenseMutation,
} = expenseApi;

export default expenseApi;
