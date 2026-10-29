import { TUser } from "@/types/auth.types";
import baseApi from "../baseApi";;

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
        getAllUsers: builder.query<TUserResponse, Record<string, any> | void>({
            query: (params) => ({
                url: '/user/get-all-users',
                method: 'GET',
                params: params || undefined,
            }),
            transformResponse: (response: any) => {
                // Case 1: Backend returns { meta, data: [...] } at the root of response
                if (response?.meta && Array.isArray(response?.data)) {
                    return {
                        data: response.data,
                        meta: response.meta,
                    };
                }

                // Case 2: Backend returns { data: { data: [...], meta: {...} } }
                if (response?.data?.meta && Array.isArray(response?.data?.data)) {
                    return {
                        data: response.data.data,
                        meta: response.data.meta,
                    };
                }

                // Fallback for direct array responses
                const data = Array.isArray(response?.data) ? response.data : [];
                return {
                    data,
                    meta: {
                        page: 1,
                        limit: data.length,
                        total: data.length,
                        totalPage: 1,
                    },
                };
            },
            providesTags: ['User'],
        }),

        getUserProfile: builder.query({
            query: () => ({
                url: '/user/profile',
                method: 'GET',
            }),
            transformResponse: (response: { success: boolean; data: any }) => response.data,
            providesTags: ['User'],
        }),

        getUserById: builder.query<any, string>({
            query: (id) => ({
                url: `/user/get-user-by-id/${id}`,
                method: 'GET',
            }),
            transformResponse: (response: any) => response?.data,
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
