import { Injectable } from "@angular/core";
import { AppState, selectAuthenticatedUser, selectUserIsAuthenticated } from "@store";
import { Store } from "@ngrx/store";
import { combineLatest, map, Observable, startWith } from "rxjs";
import { User } from "@models";

export interface SidebarFacadeModel {
  user: User;
  isAuthenticated: boolean | undefined;
}

const initialState: SidebarFacadeModel = {
  user: {} as User,
  isAuthenticated: false,
}

@Injectable()
export class SidebarFacade {
  vm$: Observable<SidebarFacadeModel>;

  constructor(private store: Store<AppState>) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<SidebarFacadeModel> {
    return combineLatest([
      this.store.select(selectAuthenticatedUser),
      this.store.select(selectUserIsAuthenticated),
    ]).pipe(
        map(([user, isAuthenticated]) => {
            return {
                user,
                isAuthenticated,
            };
        }),
        startWith(initialState),
    );
  }
}
