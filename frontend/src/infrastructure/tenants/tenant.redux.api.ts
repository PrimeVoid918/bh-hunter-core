import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import { CreateTenant, FindAllTenants, FindOneTenant } from './tenant.types';

const tenantApiRoute = `/tenants`;

export const tenantApi = createApi({
  reducerPath: 'tenantApi',
  baseQuery: fetchBaseQuery({ baseUrl: BACKEND_API }),
  tagTypes: ['Tenant'],
  endpoints: (builder) => ({
    // FETCH ALL TENANTS
    getAll: builder.query<FindAllTenants, void>({
      query: () => tenantApiRoute,
      transformResponse: (response: ApiResponseType<FindAllTenants>) =>
        response.results ?? [],
      providesTags: (result) =>
        result
          ? result.map((tenant) => ({ type: 'Tenant' as const, id: tenant.id }))
          : [],
    }),

    // FETCH ONE TENANT
    getOne: builder.query<FindOneTenant, number>({
      query: (id) => `${tenantApiRoute}/${id}`,
      transformResponse: (response: ApiResponseType<FindOneTenant>) =>
        response.results ?? null,
      providesTags: (result, error, id) => [{ type: 'Tenant', id }],
    }),

    // CREATE TENANT
    create: builder.mutation<CreateTenant, Partial<CreateTenant>>({
      query: (data) => ({
        url: tenantApiRoute,
        method: 'POST',
        body: {
          ...data,
          age: data.age !== undefined ? Number(data.age) : undefined,
        },
      }),
      invalidatesTags: ['Tenant'],
    }),

    // PATCH TENANT
    patch: builder.mutation<
      FindOneTenant,
      { id: number; data: Partial<CreateTenant> }
    >({
      query: ({ id, data }) => ({
        url: `${tenantApiRoute}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Tenant'],
    }),

    // DELETE TENANT
    delete: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `${tenantApiRoute}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tenant'],
    }),
  }),
});

// Export hooks
export const {
  useGetAllQuery,
  useGetOneQuery,
  useCreateMutation,
  usePatchMutation,
  useDeleteMutation,
} = tenantApi;
