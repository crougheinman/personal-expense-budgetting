import { createAction, props } from "@ngrx/store";

export const setStore = createAction(
  "[Inventory] Set Store",
  props<{ store: string }>()
);
