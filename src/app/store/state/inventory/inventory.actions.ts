import { Inventory } from "@app/models/inventory.model";
import { createAction, props } from "@ngrx/store";

export const setStore = createAction(
  "[Inventory] Set Store",
  props<{ store: string }>()
);

export const setInventory = createAction(
  "[Inventory] Set Inventory",
  props<{ inventory: Inventory[] }>()
);

export const setAddMode = createAction(
  "[Inventory] Set Add Mode",
  props<{ addMode: boolean }>()
);
