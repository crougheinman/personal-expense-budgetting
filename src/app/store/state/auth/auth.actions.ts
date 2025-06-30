import { createAction, props } from "@ngrx/store";

import { User } from "@models";

export const setAuthenticatedUser = createAction(
  "[Auth] Set Authenticated User",
  props<{ user: User }>()
);
export const signOut = createAction("[Auth] Sign Out");
export const signOutSuccess = createAction('[Auth] Sign Out Success');
