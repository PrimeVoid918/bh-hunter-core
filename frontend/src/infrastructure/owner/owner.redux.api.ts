import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import { CreateOwner, FindAllOwners, FindOneOwner } from './owner.types';
import { VerificationDocumentStatus } from '../documents/documents.type';

//* -- RTK ---
const ownerApiRoute = `/owners`;
export const ownerApi = createApi({
  tagTypes: ['Owner'],
  reducerPath: 'ownersApi',
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
    getAll: builder.query<FindAllOwners[], void>({
      // TODO: add pagination
      query: () => ownerApiRoute,
      transformResponse: (response: ApiResponseType<FindAllOwners[]>) =>
        response.results ?? [],
    }),
    getOne: builder.query<FindOneOwner, number>({
      query: (id) => `${ownerApiRoute}/${id}`,
      transformResponse: (response: ApiResponseType<FindOneOwner>) =>
        response.results ?? null,
      //* Optional: invalidates cache for `Owner`
      providesTags: (result, error, id) => [{ type: 'Owner', id }],
    }),
    create: builder.mutation<CreateOwner, Partial<CreateOwner>>({
      query: (data) => {
        const trans = {
          ...data,
          age: data.age !== undefined ? Number(data.age) : undefined,
        };
        return {
          url: ownerApiRoute,
          method: 'POST',
          body: trans,
        };
      },
      //* Optional: invalidates cache for `Owner`
      invalidatesTags: ['Owner'],
    }),
    getVerificationStatus: builder.query<
      VerificationDocumentStatus,
      { id: number }
    >({
      query: ({ id }) => {
        return `/owners/${id}/permits-verification-status`;
      },
      transformResponse: (
        response: ApiResponseType<VerificationDocumentStatus>,
      ) => {
        console.log('getVerificationStatus transformResponse:', response);
        return response.results!;
      },
    }),
    patch: builder.mutation<
      FindOneOwner,
      { id: number; data: Partial<CreateOwner> }
    >({
      query: ({ id, data }) => ({
        url: `${ownerApiRoute}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      //* Optional: invalidates cache for `Owner`
      invalidatesTags: ['Owner'],
    }),
    delete: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `${ownerApiRoute}/${id}`,
        method: 'DELETE',
      }),
      //* Optional: invalidates cache for `Owner`
      invalidatesTags: ['Owner'],
    }),
  }),
});
export const {
  useGetAllQuery,
  useGetOneQuery,
  useCreateMutation,
  usePatchMutation,
  useDeleteMutation,
  useGetVerificationStatusQuery,
} = ownerApi;
