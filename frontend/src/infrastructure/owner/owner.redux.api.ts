import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import {
  CreateOwner,
  FindAllOwners,
  FindAllOwnersSchema,
  FindOneOwner,
  FindOneOwnerSchema,
} from './owner.types';
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
      query: () => ownerApiRoute,
      transformResponse: (response: ApiResponseType<unknown>) => {
        const parsed = FindAllOwnersSchema.safeParse(response.results ?? []);

        if (!parsed.success) {
          console.log('Owner list shape error:', parsed.error.flatten());
          return (response.results ?? []) as FindAllOwners[];
        }

        return parsed.data;
      },
      providesTags: [{ type: 'Owner', id: 'LIST' }],
    }),

    getOne: builder.query<FindOneOwner | null, number>({
      query: (id) => `${ownerApiRoute}/${id}`,
      transformResponse: (response: ApiResponseType<unknown>) => {
        if (!response.results) return null;

        const parsed = FindOneOwnerSchema.safeParse(response.results);

        if (!parsed.success) {
          console.log('Owner detail shape error:', parsed.error.flatten());
          return response.results as FindOneOwner;
        }

        return parsed.data;
      },
      providesTags: (_result, _error, id) => [
        { type: 'Owner', id },
        { type: 'Owner', id: 'LIST' },
      ],
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
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Owner', id: arg.id },
        { type: 'Owner', id: 'LIST' },
      ],
    }),

    delete: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `${ownerApiRoute}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Owner', id },
        { type: 'Owner', id: 'LIST' },
      ],
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
