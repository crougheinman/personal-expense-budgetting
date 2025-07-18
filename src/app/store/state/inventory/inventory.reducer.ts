import { Action, createReducer, on } from "@ngrx/store";

import { setStore } from "./inventory.actions";

export const INVENTORY_FEATURE_KEY = 'inventory';

export interface InventoryState {
  store: string;
}

const initialState: InventoryState = {
  store: '',
};

const _inventoryReducer = createReducer(
  initialState,
  on(setStore, (state, { store }) => ({
    ...state,
    store
  })),
);

export function inventoryReducer(state: any, action: Action) {
    return _inventoryReducer(state, action);
}

