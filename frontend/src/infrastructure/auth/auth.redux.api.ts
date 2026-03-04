import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiResponseType } from '../common/types/backend-reponse.type';
import { BACKEND_API } from '@/app/config/api';
import { LoginResults } from './auth.types';
import { BaseUser } from '../user/user.types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_API,
    // Add prepareHeaders here so 'getCurrentUser' actually works with the token
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<
      LoginResults,
      { username: string; password: string }
    >({
      query: (credentials) => ({
        url: `/auth/login`,
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: ApiResponseType<LoginResults>) =>
        response.results,
      invalidatesTags: ['Auth'],
    }),

    getCurrentUser: builder.query<BaseUser, void>({
      query: () => `/auth/me`,
      transformResponse: (response: ApiResponseType<BaseUser>) =>
        response.results,
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useGetCurrentUserQuery } = authApi;
