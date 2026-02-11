import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import {
  VerificationDocumentMetaData,
  UserRoleType,
} from '../documents/documents.type';

const documentTypeResolver = (sourceType: UserRoleType) =>
  sourceType === 'owners' ? 'permits' : 'valid-id';

/**
 * Admin Verification Documents API
 *
 * Purpose:
 * - Fetch all verification documents (table view)
 * - Approve document
 * - Reject document
 * - Delete document
 *
 * This slice is intentionally reduced for admin-side transitions.
 */
export const validDocsApi = createApi({
  reducerPath: 'adminVerificationDocumentsApi',
  tagTypes: ['VerificationDocuments'],
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
  }),
  endpoints: (builder) => ({
    /**
     * Get all verification documents by role (owners | tenants)
     * Used in admin table listing
     */
    getAll: builder.query<VerificationDocumentMetaData[], UserRoleType>({
      query: (sourceTarget) =>
        `/${sourceTarget}/${documentTypeResolver(sourceTarget)}`,
      transformResponse: (
        response: ApiResponseType<VerificationDocumentMetaData[]>,
      ) => response.results ?? [],
      providesTags: (result, error, sourceTarget) =>
        result
          ? [
              ...result.map((doc) => ({
                type: 'VerificationDocuments' as const,
                id: `${sourceTarget}-${doc.id}`,
              })),
              { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
            ]
          : [{ type: 'VerificationDocuments', id: `${sourceTarget}-LIST` }],
    }),

    /**
     * Approve document
     */
    approve: builder.mutation<
      VerificationDocumentMetaData,
      { id: number; sourceTarget: UserRoleType }
    >({
      query: ({ id, sourceTarget }) => ({
        url: `/${sourceTarget}/${id}/${documentTypeResolver(
          sourceTarget,
        )}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id, sourceTarget }) => [
        { type: 'VerificationDocuments', id: `${sourceTarget}-${id}` },
        { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
      ],
    }),

    /**
     * Reject document
     */
    reject: builder.mutation<
      VerificationDocumentMetaData,
      { id: number; sourceTarget: UserRoleType; reason?: string }
    >({
      query: ({ id, sourceTarget, reason }) => ({
        url: `/${sourceTarget}/${id}/${documentTypeResolver(
          sourceTarget,
        )}/reject`,
        method: 'PATCH',
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (result, error, { id, sourceTarget }) => [
        { type: 'VerificationDocuments', id: `${sourceTarget}-${id}` },
        { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
      ],
    }),

    /**
     * Delete document permanently
     */
    delete: builder.mutation<
      { success: boolean },
      { id: number; sourceTarget: UserRoleType }
    >({
      query: ({ id, sourceTarget }) => ({
        url: `/${sourceTarget}/${documentTypeResolver(sourceTarget)}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { id, sourceTarget }) => [
        { type: 'VerificationDocuments', id: `${sourceTarget}-${id}` },
        { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
      ],
    }),
  }),
});

export const {
  useGetAllQuery,
  useApproveMutation,
  useRejectMutation,
  useDeleteMutation,
} = validDocsApi;
