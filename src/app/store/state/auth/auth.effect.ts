import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { tap } from "rxjs";
import { Router } from "@angular/router";
import * as fromActions from "./auth.actions";
import { Auth } from "@angular/fire/auth";
import { Store } from "@ngrx/store";
import { AppState } from "../app.state";
import { User } from "@models";

@Injectable()
export class AuthEffects {
  signOut$;
  constructor(
    private actions$: Actions,
    private router: Router,
    private auth: Auth,
    private store: Store<AppState>
  ) {
    this.signOut$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(fromActions.signOut),
          tap(() => {
            this.auth
              .signOut()
              .then(() => {
                this.store.dispatch(
                  fromActions.setAuthenticatedUser({ user: {} as User })
                );
                this.router.navigate(["/auth/signin"]);
              })
              .catch((error) => {
                console.error("Error logging out:", error);
              });
          })
        ),
      { dispatch: false }
    );
  }
}
