import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FindAllOwners, FindOneOwner } from './owner.types';

export interface OwnerSliceState {
  list: FindAllOwners; // array from findAll
  selectedUser: FindOneOwner | null; // single object from findOne
  loading: boolean;
  error: string | null;
}

const initialState: OwnerSliceState = {
  list: [],
  selectedUser: null,
  loading: false,
  error: null,
};

const ownerSlice = createSlice({
  name: 'owners',
  initialState,
  reducers: {
    setList(state, action: PayloadAction<FindAllOwners>) {
      state.list = action.payload;
    },
    selectUser(state, action: PayloadAction<FindOneOwner | null>) {
      state.selectedUser = action.payload;
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setList, selectUser, clearSelectedUser, setLoading, setError } =
  ownerSlice.actions;

export default ownerSlice.reducer;
