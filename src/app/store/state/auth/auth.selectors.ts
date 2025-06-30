import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { AUTH_FEATURE_KEY, AuthState } from './auth.reducer';

import { User } from '@models';

export const authState = createFeatureSelector<AuthState>(AUTH_FEATURE_KEY);

export const selectAuthenticatedUser = createSelector<AppState, [AuthState], User>(
    authState,
    (authStateDate: AuthState) => authStateDate?.user
);