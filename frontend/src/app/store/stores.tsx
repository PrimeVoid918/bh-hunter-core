import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../../infrastructure/auth/auth.redux.slice';
import { authApi } from '@/infrastructure/auth/auth.redux.api';
import adminSlice from '../../infrastructure/admin/admin.redux.slice';
import { adminApi } from '@/infrastructure/admin/admin.redux.api';
import { tenantApi } from '@/infrastructure/tenants/tenant.redux.api';
import tenantSlice from '../../infrastructure/tenants/tenant.redux.slice';
import ownerSlice, {
  ownerApi,
} from '../../infrastructure/owner/owner.redux.slice';
import { validDocsApi } from '@/infrastructure/valid-docs/valid-docs.redux.api';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    admins: adminSlice,
    [adminApi.reducerPath]: adminApi.reducer,
    tenants: tenantSlice,
    [tenantApi.reducerPath]: tenantApi.reducer,
    owners: ownerSlice,
    [ownerApi.reducerPath]: ownerApi.reducer,
    // permits: permitSlice
    [validDocsApi.reducerPath]: validDocsApi.reducer,
    // boardingHouses: boardingHouseSlice,
    // [boardingHouseApi.reducerPath]: boardingHouseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    // getDefaultMiddleware().concat(boardingHouseApi.middleware),
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(adminApi.middleware)
      .concat(tenantApi.middleware)
      .concat(ownerApi.middleware)
      .concat(validDocsApi.middleware),
  // .concat(boardingHouseApi.middleware),,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
