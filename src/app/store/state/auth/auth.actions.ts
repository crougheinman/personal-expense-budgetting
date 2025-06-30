import { createAction, props } from '@ngrx/store';

import { User } from '@models';

export const setAuthenticatedUser = createAction(
  '[Auth] Set Authenticated User',
    props<{ user: User }>()
);