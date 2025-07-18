import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { tap } from "rxjs";
import { Router } from "@angular/router";
import * as fromActions from "./inventory.actions";
import { Auth } from "@angular/fire/auth";
import { Store } from "@ngrx/store";
import { AppState } from "../app.state";
import { Inventory } from "@models";

@Injectable()
export class InventoryEffects {

  constructor(
    private actions$: Actions,
    private router: Router,
    private store: Store<AppState>
  ) {

  }
}
