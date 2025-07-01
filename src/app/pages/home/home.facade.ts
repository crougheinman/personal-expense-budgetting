import { Injectable } from "@angular/core";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { User } from "@models";
import { Store } from "@ngrx/store";
import { combineLatest, map, Observable, of, switchMap } from "rxjs";
export interface HomeFacadeModel {
  user?: User;
}

const initialState: HomeFacadeModel = {
  user: {} as User,
};
@Injectable()
export class HomeFacade {
    vm$: Observable<HomeFacadeModel> = of(initialState);
    constructor(private store: Store<AppState>) {
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<HomeFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
        ]).pipe(
            map(([user]) => {
                return {
                    user,
                };
            })
        );
    }

}
