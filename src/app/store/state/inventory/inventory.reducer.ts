import { Action, createReducer, on } from "@ngrx/store";

import { setAddMode, setInventory, setStore } from "./inventory.actions";
import { Inventory } from "@app/models";

export const INVENTORY_FEATURE_KEY = 'inventory';

export interface InventoryState {
  store: string;
  inventory: Inventory[];
  addMode: boolean;
}

const initialState: InventoryState = {
  store: '',
  inventory: [],
  addMode: false,
};

const _inventoryReducer = createReducer(
  initialState,
  on(setStore, (state, { store }) => ({
    ...state,
    store
  })),
  on(setInventory, (state, { inventory }) => ({
    ...state,
    inventory
  })),
  on(setAddMode, (state, { addMode }) => ({
    ...state,
    addMode
  }))
);

export function inventoryReducer(state: any, action: Action) {
    return _inventoryReducer(state, action);
}

