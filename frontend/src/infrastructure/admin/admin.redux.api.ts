import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import { Admin } from './admin.types';
import { ownerEndpoints, tenantEndpoints } from './configs';

import {
  adminTransactionsSchema,
  adminTransactionMetaDataSchema,
  adminTransactionStatsSchema,
  AdminTransactionMetaData,
  AdminTransactionStats,
} from './admin.types';

const adminApiRoute = `/admins`;
export const adminApi = createApi({
  tagTypes: ['Admin', 'Tenant', 'Owner', 'AdminTransaction'],
  reducerPath: 'adminsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
    // skips the fetchFn that logs, for debugging only
    //  fetchFn: async (input, init) => {
    //   console.log("FETCHING URL:", input);
    //   console.log("FETCH INIT:", init);
    //   return fetch(input, init);
    // },
  }),

  endpoints: (builder) => ({
    getAll: builder.query<Admin[], void>({
      // TODO: add pagination
      query: () => adminApiRoute,
      transformResponse: (response: ApiResponseType<Admin[]>) =>
        response.results ?? [],
    }),
    getOne: builder.query<Admin, number>({
      query: (id) => `${adminApiRoute}/${id}`,
      transformResponse: (response: ApiResponseType<Admin>) =>
        response.results ?? null,
      providesTags: (result, error, id) => [{ type: 'Admin', id }],
    }),
    getTransactions: builder.query<AdminTransactionMetaData[], void>({
      query: () => `${adminApiRoute}/transactions`,
      transformResponse: (
        response: ApiResponseType<unknown>,
      ): AdminTransactionMetaData[] =>
        adminTransactionsSchema.parse(response.results ?? []),
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: 'AdminTransaction' as const,
                id: item.id,
              })),
              { type: 'AdminTransaction' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminTransaction' as const, id: 'LIST' }],
    }),

    getTransaction: builder.query<AdminTransactionMetaData | null, number>({
      query: (id) => `${adminApiRoute}/transactions/${id}`,
      transformResponse: (
        response: ApiResponseType<unknown>,
      ): AdminTransactionMetaData | null => {
        if (!response.results) return null;
        return adminTransactionMetaDataSchema.parse(response.results);
      },
      providesTags: (_result, _error, id) => [{ type: 'AdminTransaction', id }],
    }),

    getTransactionStats: builder.query<AdminTransactionStats, void>({
      query: () => `${adminApiRoute}/transactions/stats`,
      transformResponse: (
        response: ApiResponseType<unknown>,
      ): AdminTransactionStats =>
        adminTransactionStatsSchema.parse(
          response.results ?? {
            total: 0,
            paid: 0,
            pending: 0,
            failed: 0,
            refunded: 0,
          },
        ),
      providesTags: [{ type: 'AdminTransactionStats', id: 'SUMMARY' }],
    }),
    create: builder.mutation<Admin, Partial<Admin>>({
      query: (data) => ({
        url: adminApiRoute,
        method: 'POST',
        body: data,
      }),
      //* Optional: invalidates cache for "Admin"
      invalidatesTags: ['Admin'],
    }),
    patch: builder.mutation<Admin, { id: number; data: Partial<Admin> }>({
      query: ({ id, data }) => ({
        url: `${adminApiRoute}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      //* Optional: invalidates cache for "Admin"
      invalidatesTags: ['Admin'],
    }),
    delete: builder.mutation<Admin, number>({
      query: (id) => ({
        url: `${adminApiRoute}/${id}`,
        method: 'DELETE',
      }),
      //* Optional: invalidates cache for "Admin"
      invalidatesTags: ['Admin'],
    }),
    ...tenantEndpoints(builder),
    ...ownerEndpoints(builder),
  }),
});
export const {
  useGetAllQuery,
  useGetOneQuery,
  useGetTransactionQuery,
  useGetTransactionStatsQuery,
  useGetTransactionsQuery,
  useCreateMutation,
  usePatchMutation,
  useDeleteMutation,
  useGetAllTenantsQuery,
  useCreateTenantMutation,
  useDeleteTenantMutation,
  useGetAllOwnersQuery,
  useCreateOwnerMutation,
  useDeleteOwnerMutation,
} = adminApi;
