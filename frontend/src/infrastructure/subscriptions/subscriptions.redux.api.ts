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
    // 🔹 GET /subscriptions/plans
    getPlans: builder.query<SubscriptionPlan[], void>({
      query: () => `${subscriptionApiRoute}/plans`,
      transformResponse: (response: ApiResponseType<SubscriptionPlan[]>) =>
        response.results ?? [],
      providesTags: ['SubscriptionPlans'],
    }),

    getPlansById: builder.query<SubscriptionPlan, { planId: string | null }>({
      query: ({ planId }) => `${subscriptionApiRoute}/plans/${planId}`,
      transformResponse: (response: ApiResponseType<SubscriptionPlan>) =>
        response.results ?? [],
      providesTags: ['SubscriptionPlans'],
    }),

    // 🔹 POST /subscriptions/:ownerId/checkout
    createCheckout: builder.mutation<
      { paymentId: number; checkoutUrl: string },
      { ownerId: number; planId: string }
    >({
      query: ({ ownerId, planId }) => ({
        url: `${subscriptionApiRoute}/${ownerId}/checkout`,
        method: 'POST',
        body: { planId },
      }),
    }),

    // 🔹 POST /subscriptions/trial
    createTrial: builder.mutation<Subscription, { ownerId: number }>({
      query: ({ ownerId }) => ({
        url: `${subscriptionApiRoute}/trial`,
        method: 'POST',
        body: { ownerId },
      }),
      invalidatesTags: ['Subscription'],
    }),

    // 🔹 GET /subscriptions?ownerId=
    getAll: builder.query<Subscription[], number>({
      query: (ownerId) => `${subscriptionApiRoute}?ownerId=${ownerId}`,
      transformResponse: (response: ApiResponseType<Subscription[]>) =>
        response.results ?? [],
      providesTags: ['Subscription'],
    }),

    // 🔹 GET /subscriptions/active/:ownerId
    getActive: builder.query<Subscription | null, number>({
      query: (ownerId) => `${subscriptionApiRoute}/active/${ownerId}`,
      transformResponse: (response: ApiResponseType<Subscription>) =>
        response.results ?? null,
      providesTags: (result, error, ownerId) => [
        { type: 'Subscription', id: ownerId },
      ],
    }),

    // 🔹 PATCH /subscriptions/expire/:id
    expire: builder.mutation<Subscription, number>({
      query: (id) => ({
        url: `${subscriptionApiRoute}/expire/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Subscription'],
    }),

    // 🔹 DELETE /subscriptions/:id
    delete: builder.mutation<Subscription, number>({
      query: (id) => ({
        url: `${subscriptionApiRoute}/${id}`,
        method: 'DELETE',
      }),
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
