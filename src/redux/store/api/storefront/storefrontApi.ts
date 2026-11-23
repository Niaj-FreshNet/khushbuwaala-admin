import { baseApi } from '../baseApi';
import type { ApiEnvelope } from '@/types/api.types';
import type { StorefrontSettings, StorefrontSettingsAdmin } from '@/types/storefront.types';

export const storefrontApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStorefrontSettings: builder.query<StorefrontSettingsAdmin, void>({
      query: () => '/storefront/settings/admin',
      transformResponse: (res: ApiEnvelope<StorefrontSettingsAdmin>) => res.data,
      providesTags: ['Storefront'],
    }),
    saveStorefrontSettings: builder.mutation<Omit<StorefrontSettingsAdmin, 'defaults' | 'limits'>, StorefrontSettings>({
      query: (body) => ({ url: '/storefront/settings', method: 'PUT', body }),
      transformResponse: (res: ApiEnvelope<Omit<StorefrontSettingsAdmin, 'defaults' | 'limits'>>) => res.data,
      invalidatesTags: ['Storefront'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetStorefrontSettingsQuery, useSaveStorefrontSettingsMutation } = storefrontApi;
