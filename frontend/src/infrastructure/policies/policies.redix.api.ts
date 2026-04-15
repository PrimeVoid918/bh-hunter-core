import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const policiesApiRoute = `/policies`;

export const policiesApi = createApi({
  reducerPath: 'policiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
    fetchFn: async (input, init) => fetch(input, init),
  }),
  endpoints: (builder) => ({
    getRefundPolicies: builder.query<
      string,
      { type: 'booking' | 'subscription' }
    >({
      query: ({ type }) => ({
        url: `${policiesApiRoute}/refund/${type}`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getUserLegitimacyConsentPolicies: builder.query<
      string,
      { type: 'owner' | 'tenant' }
    >({
      query: ({ type }) => ({
        url: `${policiesApiRoute}/consent/${type}`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getTerms: builder.query<string, void>({
      query: () => ({
        url: `${policiesApiRoute}/terms`,
        responseHandler: (response) => response.text(),
      }),
    }),
    getPrivacy: builder.query<string, void>({
      query: () => ({
        url: `${policiesApiRoute}/privacy`,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useGetRefundPoliciesQuery,
  useGetTermsQuery,
  useGetPrivacyQuery,
  useGetUserLegitimacyConsentPoliciesQuery,
} = policiesApi;
