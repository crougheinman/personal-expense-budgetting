import { Action, createReducer, on } from "@ngrx/store";

import { User } from "@models";
import { setAuthenticatedUser } from "./auth.actions";

export const AUTH_FEATURE_KEY = 'auth';

export interface AuthState {
  user: User;
  tokenId?: string;
}

const initialState: AuthState = {
  user: {} as User,
  tokenId: undefined,
};

const _authReducer = createReducer(
  initialState,
  on(setAuthenticatedUser, (state, { user }) => ({
    ...state,
    user: {
      displayName:'testoo',
      email: 'test email'
    },
  }))
);

export function authReducer(state: any, action: Action) {
    return _authReducer(state, action);
}

