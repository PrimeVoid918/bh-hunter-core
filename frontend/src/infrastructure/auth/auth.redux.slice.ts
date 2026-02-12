import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from './auth.types';
import { AdminData } from './types/user.types';

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isLoggedIn: !!localStorage.getItem('token'),
  status: 'idle',
  error: null,
};

/**
 * Authentication slice for managing user login, logout, and session state.
 *
 * @remarks
 * - Uses Redux Toolkit `createSlice`.
 * - Stores `token`, `user`, and async `status`.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Triggered when login starts (loading state).
     */
    loginStart(state) {
      state.status = 'loading';
      state.error = null;
    },

    /**
     * Triggered when login succeeds.
     *
     * @param action - Contains `token` and `userData` returned from the backend.
     */
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; userData: AdminData }>,
    ) {
      state.token = action.payload.token;
      state.isLoggedIn = true;
      state.user = action.payload.userData;
      state.status = 'succeeded';
      state.error = null;

      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.userData));
    },

    /**
     * Triggered when login fails.
     *
     * @param action - Error message string.
     */
    loginFailure(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },

    /**
     * Logs the user out and clears auth state.
     */
    logout(state) {
      state.isLoggedIn = false;
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

// -------------------------
// Selectors
// -------------------------

/**
 * Selector: Returns the current user's ID.
 */
export const selectAdminId = (state: { auth: AuthState }) =>
  state.auth.user?.id; // Assumes your AdminData has an 'id' property

/**
 * Selector: Returns whether a user is logged in.
 */
export const selectIsLoggedIn = (state: { auth: AuthState }) =>
  !!state.auth.token;

/**
 * Selector: Returns the current user's role, if available.
 */
export const selectUserRole = (state: { auth: AuthState }) =>
  state.auth.user?.role;

/**
 * Selector: Returns the current auth request status.
 */
export const selectAuthStatus = (state: { auth: AuthState }) =>
  state.auth.status;

/**
 * Selector: Returns the current auth error.
 */
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// -------------------------
// Exports
// -------------------------
export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;

// * Combined Usage * in simple login
/*
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout, selectIsLoggedIn, selectUserRole } from './authSlice';

export const LoginButton: React.FC = () => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const role = useSelector(selectUserRole);

  const handleLogin = async () => {
    dispatch(loginStart());
    try {
      // Simulate API call
      const fakeResponse = {
        token: '12345',
        userData: { id: '1', name: 'Admin', role: 'superadmin' },
      };
      setTimeout(() => {
        dispatch(loginSuccess(fakeResponse));
      }, 1000);
    } catch (err) {
      dispatch(loginFailure('Login failed'));
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Welcome! Role: {role}</p>
          <button onClick={() => dispatch(logout())}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};

 */

// TODO SECTION
//* 🔐 Improve auth caching and cleanup strategy
/*
 * Currently, `login` sets token/userData in Redux, but on app reload or resume,
 * cached state may persist due to Redux-Persist or internal memory state.
 *
 * ✅ PROPOSALS:
 * 1. Add `isLoading` and `isAuthenticated` flags to track transitions clearly.
 * 2. Auto-clear all sensitive slices (e.g., tenant/owner/admin data) on logout.
 * 3. Use `secureStore` or encrypted storage (e.g., Expo SecureStore or react-native-keychain) for tokens.
 * 4. On logout or token expiry, call `resetApiState()` from RTK Query to fully purge cache:
 *    - dispatch(api.util.resetApiState());
 *    - Prevents stale or unauthorized fetches after logout.
 * 5. Consider storing the last login timestamp for session expiry or idle logout.
 * 6. Optionally throttle/suppress auto-login logic when app cold starts (e.g., debounce 500ms).
 * 7. Display a minimal loading screen while checking auth status before rendering sensitive UI.
 *
 * This ensures that sensitive data is:
 * - Fully cleared on logout
 * - Not cached beyond its session scope
 * - Safer on shared/public devices
 * - Compliant with best practices (esp. if handling personal or financial info)
 */
