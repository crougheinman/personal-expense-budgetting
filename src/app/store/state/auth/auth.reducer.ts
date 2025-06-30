import { Action, createReducer, on } from "@ngrx/store";

import { User } from "@models";
import { setAuthenticatedUser } from "./auth.actions";

export const AUTH_FEATURE_KEY = 'auth';

export interface AuthState {
  user: User;
  isAuthenticated?: boolean;
}

const initialState: AuthState = {
  user: {} as User,
  isAuthenticated: false,
};

const _authReducer = createReducer(
  initialState,
  on(setAuthenticatedUser, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: !!user && Object.keys(user).length > 0, // Check if user is not empty
  })),
);

export function authReducer(state: any, action: Action) {
    return _authReducer(state, action);
}

