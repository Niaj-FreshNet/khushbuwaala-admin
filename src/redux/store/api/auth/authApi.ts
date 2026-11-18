import { RefreshResponse } from "@/types/auth.types";
import baseApi from "../baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logIn: builder.mutation({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: ['Auth'],
    }),

    register: builder.mutation({
      query: (formData) => ({
        url: '/auth/register',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Auth'],
    }),

    forgotPassword: builder.mutation({
      query: ({ email }) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
      invalidatesTags: ['Auth'],
    }),

    getMeUser: builder.query({
      query: () => ({
        url: '/auth/get-me',
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: ['Auth', 'User'],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    refreshToken: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
        credentials: "include", // if using httpOnly cookies
      }),
      invalidatesTags: ['Auth'],
    }),

    userVerification: builder.mutation({
      query: ({ email, token }) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: { email, token },
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    resendOtp: builder.mutation({
      query: ({ email }) => ({
        url: '/auth/resend-verify-email-token',
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: ['Auth'],
    }),

    makeAdmin: builder.mutation({
      query: (payload: { name: string; email: string; password: string }) => ({
        url: '/auth/make-admin',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['User'],
    }),

    makeSalesman: builder.mutation({
      query: (payload: { name: string; email: string; password: string }) => ({
        url: '/auth/make-salesman',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['User'],
    }),

    approveOrUpdateRole: builder.mutation({
      query: (body) => ({
        url: '/auth/approve-role',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        credentials: 'include', // needed to clear httpOnly cookie
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useLogInMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useGetMeUserQuery,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useUserVerificationMutation,
  useResendOtpMutation,
  useMakeAdminMutation,
  useMakeSalesmanMutation,
  useApproveOrUpdateRoleMutation,
  useLogoutMutation,
} = authApi;

export default authApi;
