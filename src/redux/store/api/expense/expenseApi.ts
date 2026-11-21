import baseApi from '../baseApi';

const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addExpense: builder.mutation<any, any>({
      query: (body) => ({
        url: '/expenses/create-expense',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
    getAllExpenses: builder.query({
      query: (params) => ({
        url: '/expenses/get-all-expenses',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Expenses'],
    }),
    getExpenseDetails: builder.query({
      query: (id) => ({
        url: `/expenses/get-expense-by-id/${id}`,
        method: 'GET',
      }),
      providesTags: ['Expenses'],
    }),
    updateExpense: builder.mutation({
      query: ({ id, status }) => ({
        url: `/expenses/update-expense-status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Expenses', 'Finance'],
    }),
    deleteExpense: builder.mutation<any, string>({
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
  useDeleteExpenseMutation,
} = expenseApi;

export default expenseApi;