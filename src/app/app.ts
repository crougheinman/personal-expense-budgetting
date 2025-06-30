import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "./store";
import { combineLatest, map, Observable } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.html",
  standalone: false,
  styleUrl: "./app.scss",
})
export class App {
  headerStates$: Observable<any>;

  constructor(private store: Store<AppState>) {
    this.headerStates$ = combineLatest([
      this.store.select(selectAuthenticatedUser),
    ]).pipe(
      map(([user]) => ({
        user: user,
      }))
    );
  }

  protected title = "PEB";
}
