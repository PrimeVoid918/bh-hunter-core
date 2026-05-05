import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import {
  Admin,
  AdminSuspendUserPayload,
  AdminSuspendUserResponse,
  RefundRequest,
  RefundRequestResponse,
} from './admin.types';
import { ownerEndpoints, tenantEndpoints } from './configs';

import {
  adminTransactionsSchema,
  adminTransactionMetaDataSchema,
  adminTransactionStatsSchema,
  AdminTransactionMetaData,
  AdminTransactionStats,
} from './admin.types';
import { refundRequestsSchema } from './admin.schemas';

const adminApiRoute = `/admins`;
export const adminApi = createApi({
  // tagTypes: ['Admin', 'Tenant', 'Owner', 'AdminTransaction'],
  tagTypes: [
    'Admin',
    'Tenant',
    'Owner',
    'AdminTransaction',
    'AdminTransactionStats',
    'RefundRequest',
  ],
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

    getRefundRequests: builder.query<
      RefundRequestResponse,
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: `${adminApiRoute}/refund-requests`,
        params,
      }),

      transformResponse: (
        response: ApiResponseType<RefundRequestResponse>,
      ): RefundRequestResponse => {
        return response.results;
      },
    }),
    approveRefundRequest: builder.mutation<
      any,
      { id: number; adminId: number; notes?: string }
    >({
      query: ({ id, adminId, notes }) => ({
        url: `${adminApiRoute}/refund-requests/${id}/approve`,
        method: 'PATCH',
        body: { adminId, notes },
      }),
      invalidatesTags: [{ type: 'AdminTransaction', id: 'REFUND_LIST' }],
    }),

    rejectRefundRequest: builder.mutation<
      any,
      { id: number; adminId: number; notes?: string }
    >({
      query: ({ id, adminId, notes }) => ({
        url: `${adminApiRoute}/refund-requests/${id}/reject`,
        method: 'PATCH',
        body: { adminId, notes },
      }),
      invalidatesTags: [{ type: 'AdminTransaction', id: 'REFUND_LIST' }],
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
    suspendTenant: builder.mutation<
      AdminSuspendUserResponse,
      {
        adminId: number;
        tenantId: number;
        payload?: AdminSuspendUserPayload;
      }
    >({
      query: ({ adminId, tenantId, payload }) => ({
        url: `${adminApiRoute}/${adminId}/tenants/${tenantId}/suspend`,
        method: 'PATCH',
        body: payload ?? {},
      }),
      transformResponse: (
        response: ApiResponseType<AdminSuspendUserResponse>,
      ) => response.results,
      invalidatesTags: ['Tenant'],
    }),

    unsuspendTenant: builder.mutation<
      AdminSuspendUserResponse,
      {
        adminId: number;
        tenantId: number;
        payload?: AdminSuspendUserPayload;
      }
    >({
      query: ({ adminId, tenantId, payload }) => ({
        url: `${adminApiRoute}/${adminId}/tenants/${tenantId}/unsuspend`,
        method: 'PATCH',
        body: payload ?? {},
      }),
      transformResponse: (
        response: ApiResponseType<AdminSuspendUserResponse>,
      ) => response.results,
      invalidatesTags: ['Tenant'],
    }),

    suspendOwner: builder.mutation<
      AdminSuspendUserResponse,
      {
        adminId: number;
        ownerId: number;
        payload?: AdminSuspendUserPayload;
      }
    >({
      query: ({ adminId, ownerId, payload }) => ({
        url: `${adminApiRoute}/${adminId}/owners/${ownerId}/suspend`,
        method: 'PATCH',
        body: payload ?? {},
      }),
      transformResponse: (
        response: ApiResponseType<AdminSuspendUserResponse>,
      ) => response.results,
      invalidatesTags: ['Owner'],
    }),

    unsuspendOwner: builder.mutation<
      AdminSuspendUserResponse,
      {
        adminId: number;
        ownerId: number;
        payload?: AdminSuspendUserPayload;
      }
    >({
      query: ({ adminId, ownerId, payload }) => ({
        url: `${adminApiRoute}/${adminId}/owners/${ownerId}/unsuspend`,
        method: 'PATCH',
        body: payload ?? {},
      }),
      transformResponse: (
        response: ApiResponseType<AdminSuspendUserResponse>,
      ) => response.results,
      invalidatesTags: ['Owner'],
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
  useGetRefundRequestsQuery,
  useApproveRefundRequestMutation,
  useRejectRefundRequestMutation,
  useCreateMutation,
  usePatchMutation,
  useDeleteMutation,

  useSuspendTenantMutation,
  useUnsuspendTenantMutation,
  useSuspendOwnerMutation,
  useUnsuspendOwnerMutation,

  useGetAllTenantsQuery,
  useCreateTenantMutation,
  useDeleteTenantMutation,
  useGetAllOwnersQuery,
  useCreateOwnerMutation,
  useDeleteOwnerMutation,
} = adminApi;
