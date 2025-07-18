import * as fromAuth from './auth/auth.reducer';
import * as fromInventory from './inventory/inventory.reducer';

export interface AppState {
    auth: fromAuth.AuthState | {};
    inventory: fromInventory.InventoryState | {};
}

export const initialState: AppState = {
    auth: {},
    inventory: {},
};
