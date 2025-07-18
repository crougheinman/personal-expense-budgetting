import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { INVENTORY_FEATURE_KEY, InventoryState } from './inventory.reducer';

export const inventoryState = createFeatureSelector<InventoryState>(INVENTORY_FEATURE_KEY);

export const selectedStore = createSelector<AppState, [InventoryState], string>(
    inventoryState,
    (inventoryState) => inventoryState?.store
);