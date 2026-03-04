import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Owner, OwnerState } from './owner.types';

const initialState: OwnerState = {
  selectedUser: null,
  filter: '',
  loading: false,
  error: null,
};

//* -- Slice --
const ownerSlice = createSlice({
  name: 'owners',
  initialState,
  reducers: {
    selectUser(state, action: PayloadAction<Owner>) {
      state.selectedUser = action.payload;
    },
    clearSelectedUser(state) {
      state.selectedUser = null;
    },
  },
});

export const { selectUser, clearSelectedUser } = ownerSlice.actions;

export default ownerSlice.reducer;
