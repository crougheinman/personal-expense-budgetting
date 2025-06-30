import * as fromAuth from './auth/auth.reducer';

export interface AppState {
    authState: fromAuth.AuthState;
}

export const initialState: AppState = {
    authState: {} as fromAuth.AuthState,
};
