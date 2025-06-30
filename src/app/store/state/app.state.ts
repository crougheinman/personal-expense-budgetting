import * as fromAuth from './auth/auth.reducer';

export interface AppState {
    auth: fromAuth.AuthState | {};
}

export const initialState: AppState = {
    auth: {},
};
