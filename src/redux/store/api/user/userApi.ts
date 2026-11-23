import { TUser } from "@/types/auth.types";
import baseApi from "../baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export interface TMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}

export interface TUserResponse {
    data: TUser[];
    meta: TMeta;
}

const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllUsers: builder.query<TUserResponse, Record<string, string | number | boolean | undefined> | void>({
            query: (params) => ({
                url: '/user/get-all-users',
                method: 'GET',
                params: params || undefined,
            }),
            // the backend sends { success, meta, data: [...] } (user.controller getAllUsers)
            transformResponse: (response: ApiEnvelope<TUser[]> & { meta?: TMeta }) => {
                const data = Array.isArray(response?.data) ? response.data : [];
                return {
                    data,
                    meta: response?.meta ?? { page: 1, limit: data.length, total: data.length, totalPage: 1 },
                };
            },
            providesTags: ['User'],
        }),

        getUserProfile: builder.query<TUser, void>({
            query: () => ({
                url: '/user/profile',
                method: 'GET',
            }),
            transformResponse: (response: ApiEnvelope<TUser>) => response.data,
            providesTags: ['User'],
        }),

        getUserById: builder.query<TUser | null, string>({
            query: (id) => ({
                url: `/user/get-user-by-id/${id}`,
                method: 'GET',
            }),
            transformResponse: (response: ApiEnvelope<TUser | null>) => response?.data ?? null,
            providesTags: ['User'],
        }),

        updateUserProfile: builder.mutation<
            TUser, // response type
            { id: string; updates: Partial<TUser> } // request type
        >({
            query: ({ id, updates }) => ({
                url: `/user/update-profile/${id}`,
                method: "PATCH",
                body: updates,
            }),
            invalidatesTags: ["User"],
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: '/user/change-password',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User', 'Auth'],
        }),
    }),
    overrideExisting: true,
});

export const {
    useGetAllUsersQuery,
    useGetUserProfileQuery,
    useGetUserByIdQuery,
    useLazyGetUserByIdQuery,
    useUpdateUserProfileMutation,
    useChangePasswordMutation,
} = userApi;

export default userApi;
