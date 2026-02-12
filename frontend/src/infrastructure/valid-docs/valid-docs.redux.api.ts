import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import {
  VerificationDocumentMetaDataGetOne,
  VerificationStatus,
} from '../documents/documents.type';
import {
  VerificationDocumentMetaData,
  UserRoleType,
} from '../documents/documents.type';
import { UserRole } from '../user/user.types';

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

    getOne: builder.query<
      VerificationDocumentMetaDataGetOne,
      { userType: UserRoleType; documentId: number }
    >({
      query: ({ userType, documentId }) =>
        `/${userType}/${documentId}/${documentTypeResolver(userType)}`,
      transformResponse: (
        response: ApiResponseType<VerificationDocumentMetaDataGetOne>,
      ) => response.results ?? [],
      providesTags: (result, error, sourceTarget) =>
        result
          ? [
              // single object tag
              {
                type: 'VerificationDocuments' as const,
                id: `${sourceTarget}-${result.id}`,
              },
              // general list tag
              { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
            ]
          : [{ type: 'VerificationDocuments', id: `${sourceTarget}-LIST` }],
    }),

    // /**
    //  * Approve document
    //  */
    // approve: builder.mutation<
    //   VerificationDocumentMetaData,
    //   { id: number; sourceTarget: UserRoleType }
    // >({
    //   query: ({ id, sourceTarget }) => ({
    //     url: `/${sourceTarget}/${documentTypeResolver(sourceTarget)}/${id}`,
    //     method: 'PATCH',
    //   }),
    //   invalidatesTags: (result, error, { id, sourceTarget }) => [
    //     { type: 'VerificationDocuments', id: `${sourceTarget}-${id}` },
    //     { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
    //   ],
    // }),

    // /**
    //  * Reject document
    //  */
    // reject: builder.mutation<
    //   VerificationDocumentMetaData,
    //   { id: number; sourceTarget: UserRoleType; reason?: string }
    // >({
    //   query: ({ id, sourceTarget, reason }) => ({
    //     url: `/${sourceTarget}/${documentTypeResolver(sourceTarget)}/${id}`,
    //     method: 'PATCH',
    //     body: reason ? { reason } : undefined,
    //   }),
    //   invalidatesTags: (result, error, { id, sourceTarget }) => [
    //     { type: 'VerificationDocuments', id: `${sourceTarget}-${id}` },
    //     { type: 'VerificationDocuments', id: `${sourceTarget}-LIST` },
    //   ],
    // }),

    patch: builder.mutation<
      VerificationDocumentMetaData,
      {
        id: number;
        sourceTarget: UserRoleType;
        payload: {
          adminId: number;
          rejectReason?: string;
          verificationStatus: VerificationStatus;
        };
      }
    >({
      query: ({ id, payload }) => ({
        url: `/admins/${id}/verify-document`,
        method: 'PATCH',
        body: payload,
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
      { id: number; adminId: number; sourceTarget: UserRoleType }
    >({
      query: ({ id, adminId }) => ({
        url: `/admins/${id}/verify-document`,
        method: 'DELETE',
        body: {
          adminId: adminId,
        },
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
  useGetOneQuery,
  usePatchMutation,
  useDeleteMutation,
} = validDocsApi;
