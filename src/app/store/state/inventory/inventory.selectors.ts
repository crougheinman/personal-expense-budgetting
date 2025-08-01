import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from '../app.state';
import { INVENTORY_FEATURE_KEY, InventoryState } from './inventory.reducer';
import { Inventory } from '@app/models/inventory.model';

export const inventoryState = createFeatureSelector<InventoryState>(INVENTORY_FEATURE_KEY);

export const selectedStore = createSelector<AppState, [InventoryState], string>(
    inventoryState,
    (inventoryState) => inventoryState?.store
);

export const selectInventory = createSelector<AppState, [InventoryState], Inventory[]>(
    inventoryState,
    (inventoryState) => inventoryState?.inventory || []
);

export const selectAddMode = createSelector<AppState, [InventoryState], boolean>(
    inventoryState,
    (inventoryState) => inventoryState?.addMode || false
);