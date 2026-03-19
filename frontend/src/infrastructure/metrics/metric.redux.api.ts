import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  UsersMetricsSchema,
  PropertiesMetricsSchema,
  BookingsMetricsSchema,
  PaymentsMetricsSchema,
  SubscriptionsMetricsSchema,
  ReviewsMetricsSchema,
  OverviewMetricsSchema,
} from './metrics.schema';
import { z } from 'zod';
import { ApiResponseType } from '../common/types/backend-reponse.type';

const metricsApiRoute = `metrics`;

export const metricsApi = createApi({
  reducerPath: 'metricsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
    fetchFn: async (input, init) => fetch(input, init),
  }),
  tagTypes: ['Metrics'],
  endpoints: (builder) => ({
    getUsersMetrics: builder.query<z.infer<typeof UsersMetricsSchema>, void>({
      query: () => `${metricsApiRoute}/users`,
      transformResponse: (response: any) => UsersMetricsSchema.parse(response),
      providesTags: ['Metrics'],
    }),

    getPropertiesMetrics: builder.query<
      z.infer<typeof PropertiesMetricsSchema>,
      { userId?: number; role?: 'OWNER' | 'TENANT' } | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/properties?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof PropertiesMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),

    getBookingsMetrics: builder.query<
      z.infer<typeof BookingsMetricsSchema>,
      | {
          timeframe?: 'week' | 'month';
          userId?: number;
          role?: 'OWNER' | 'TENANT';
        }
      | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/bookings?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof BookingsMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),

    getPaymentsMetrics: builder.query<
      z.infer<typeof PaymentsMetricsSchema>,
      | {
          timeframe?: 'week' | 'month';
          userId?: number;
          role?: 'OWNER' | 'TENANT';
        }
      | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/payments?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof PaymentsMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),

    getSubscriptionsMetrics: builder.query<
      z.infer<typeof SubscriptionsMetricsSchema>,
      | {
          timeframe?: 'week' | 'month';
          userId?: number;
          role?: 'OWNER' | 'TENANT';
        }
      | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/subscriptions?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof SubscriptionsMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),

    getReviewsMetrics: builder.query<
      z.infer<typeof ReviewsMetricsSchema>,
      { userId?: number; role?: 'OWNER' | 'TENANT' } | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/reviews?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof ReviewsMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),

    getOverviewMetrics: builder.query<
      z.infer<typeof OverviewMetricsSchema>,
      | {
          timeframe?: 'week' | 'month';
          userId?: number;
          role?: 'OWNER' | 'TENANT';
        }
      | undefined
    >({
      query: (params) => {
        const qs = new URLSearchParams(
          Object.entries(params ?? {})
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        );
        return `${metricsApiRoute}/overview?${qs.toString()}`;
      },
      transformResponse: (
        response: ApiResponseType<z.infer<typeof OverviewMetricsSchema>>,
      ) => response.results ?? {},
      providesTags: ['Metrics'],
    }),
  }),
});

export const {
  useGetUsersMetricsQuery,
  useGetPropertiesMetricsQuery,
  useGetBookingsMetricsQuery,
  useGetPaymentsMetricsQuery,
  useGetSubscriptionsMetricsQuery,
  useGetReviewsMetricsQuery,
  useGetOverviewMetricsQuery,
} = metricsApi;
