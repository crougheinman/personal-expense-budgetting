import { Injectable } from "@angular/core";
import { AppState, selectAuthenticatedUser } from "@store";
import { Store } from "@ngrx/store";
import { map, Observable, startWith } from "rxjs";
import { User } from "@models";

export interface SidebarFacadeModel {
  user: User;
}

const initialState: SidebarFacadeModel = {
  user: {} as User,
}

@Injectable()
export class SidebarFacade {
  vm$: Observable<SidebarFacadeModel>;

  constructor(private store: Store<AppState>) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<SidebarFacadeModel> {
    return this.store.select(selectAuthenticatedUser).pipe(
        map((user) => {
            console.log("SidebarFacade - User:", user);
            
            return {
                user
            };
        }),
        startWith(initialState),
    );
  }
}
