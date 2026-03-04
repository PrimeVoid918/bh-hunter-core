import { createSlice } from '@reduxjs/toolkit';
import { BaseUser } from '../user/user.types';
import { authApi } from './auth.redux.api';

interface OwnerAuthState {
  owner: BaseUser | null;
  ownerToken: string | null;
  isOwnerLoggedIn: boolean;
}

const initialState: OwnerAuthState = {
  // Use unique keys so they don't overwrite Admin 'token' and 'user'
  ownerToken: localStorage.getItem('owner_token'),
  owner: JSON.parse(localStorage.getItem('owner_data') || 'null'),
  isOwnerLoggedIn: !!localStorage.getItem('owner_token'),
};

const ownerAuthSlice = createSlice({
  name: 'ownerAuth',
  initialState,
  reducers: {
    clearOwnerSession(state) {
      state.owner = null;
      state.ownerToken = null;
      state.isOwnerLoggedIn = false;
      localStorage.removeItem('owner_token');
      localStorage.removeItem('owner_data');
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        // ONLY save if the role is OWNER
        if (payload.user.role === 'OWNER') {
          state.ownerToken = payload.access_token;
          state.owner = payload.user;
          state.isOwnerLoggedIn = true;
          localStorage.setItem('owner_token', payload.access_token);
          localStorage.setItem('owner_data', JSON.stringify(payload.user));
        }
      },
    );
  },
});

export const { clearOwnerSession } = ownerAuthSlice.actions;
export default ownerAuthSlice.reducer;
