import { BACKEND_API } from '@/app/config/api';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import { Subscription, SubscriptionPlan } from './subscriptions.schema';

const subscriptionApiRoute = `/subscriptions`;

export const subscriptionsApi = createApi({
  tagTypes: ['Subscription', 'SubscriptionPlans'],
  reducerPath: 'subscriptionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
  }),
  endpoints: (builder) => ({
    getPlans: builder.query<SubscriptionPlan[], void>({
      query: () => `${subscriptionApiRoute}/plans`,
      transformResponse: (response: ApiResponseType<SubscriptionPlan[]>) =>
        response.results ?? null,
      providesTags: ['SubscriptionPlans'],
    }),
    getPlansById: builder.query<SubscriptionPlan | null, { planId: string }>({
      query: ({ planId }) => `${subscriptionApiRoute}/plans/${planId}`,
      transformResponse: (response: ApiResponseType<SubscriptionPlan>) =>
        response.results ?? null,
      providesTags: ['SubscriptionPlans'],
    }),
    createCheckout: builder.mutation<
      { paymentId: number; checkoutUrl: string },
      { ownerId: number; planId: string }
    >({
      query: ({ ownerId, planId }) => ({
        url: `${subscriptionApiRoute}/${ownerId}/checkout`,
        method: 'POST',
        body: { planId },
      }),
      transformResponse: (
        response: ApiResponseType<{ paymentId: number; checkoutUrl: string }>,
      ) => response.results ?? null,
    }),
    createTrial: builder.mutation<Subscription, { ownerId: number }>({
      query: ({ ownerId }) => ({
        url: `${subscriptionApiRoute}/trial`,
        method: 'POST',
        body: { ownerId },
      }),
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      invalidatesTags: ['Subscription'],
    }),
    refundSubscription: builder.mutation<Subscription, number>({
      query: (ownerId) => ({
        url: `${subscriptionApiRoute}/cancel`,
        method: 'POST',
        body: { ownerId }, // send ownerId in the request body
      }),
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      invalidatesTags: ['Subscription'],
    }),
    getAll: builder.query<Subscription[], number>({
      query: (ownerId) => `${subscriptionApiRoute}?ownerId=${ownerId}`,
      transformResponse: (response: ApiResponseType<Subscription[]>) =>
        response.results ?? null,
      providesTags: ['Subscription'],
    }),
    getActive: builder.query<Subscription | null, number>({
      query: (ownerId) => `${subscriptionApiRoute}/active/${ownerId}`,
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      providesTags: (result, error, ownerId) => [
        { type: 'Subscription', id: ownerId },
      ],
    }),
    expire: builder.mutation<Subscription, number>({
      query: (id) => ({
        url: `${subscriptionApiRoute}/expire/${id}`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      invalidatesTags: ['Subscription'],
    }),
    delete: builder.mutation<Subscription, number>({
      query: (id) => ({
        url: `${subscriptionApiRoute}/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetPlansByIdQuery,
  useCreateCheckoutMutation,
  useCreateTrialMutation,
  useGetAllQuery,
  useGetActiveQuery,
  useExpireMutation,
  useDeleteMutation,
  useRefundSubscriptionMutation,
} = subscriptionsApi;

/**
 * const [createCheckout] = useCreateCheckoutMutation();

const handleSubscribe = async (planId: string) => {
  const res = await createCheckout({
    ownerId: owner.id,
    planId,
  }).unwrap();

  Linking.openURL(res.checkoutUrl);
};
 */
