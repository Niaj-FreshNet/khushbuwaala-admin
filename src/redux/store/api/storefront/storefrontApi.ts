import { baseApi } from '../baseApi';
import type { ApiEnvelope } from '@/types/api.types';
import type { FragranceDataCheck, StorefrontSettings, StorefrontSettingsAdmin } from '@/types/storefront.types';

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
    // Products change on other screens, so this is fetched fresh each time the page opens.
    getFragranceDataCheck: builder.query<FragranceDataCheck, void>({
      query: () => '/discover/data-check',
      transformResponse: (res: ApiEnvelope<FragranceDataCheck>) => res.data,
      keepUnusedDataFor: 0,
      providesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetStorefrontSettingsQuery, useSaveStorefrontSettingsMutation, useGetFragranceDataCheckQuery } = storefrontApi;
