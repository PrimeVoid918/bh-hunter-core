import { AsyncStatus } from '../common/types/status.types';
import { BaseUser } from '../user/user.types';

export interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  user: BaseUser | null;
  status: AsyncStatus;
  error: null | string;
}

export interface LoginResults {
  access_token: string;
  user: BaseUser;
}
