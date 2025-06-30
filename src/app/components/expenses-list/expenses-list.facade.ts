import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { combineLatest, map, Observable, of } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";

export interface ExpensesListFacadeModel {
  expenses?: Expense[];
}

const initialState: ExpensesListFacadeModel = {
  expenses: [],
};

@Injectable()
export class ExpensesListFacade {
  vm$: Observable<ExpensesListFacadeModel> = of({});

  constructor(private expensesService: ExpensesService, private store: Store<AppState>) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<ExpensesListFacadeModel> {
    return combineLatest([
      this.getExpenses(),
      this.store.select(selectAuthenticatedUser),
    ]).pipe(
      map(([expenses, user]) => {
        return {
          expenses: expenses,
        };
      })
    );
  }

  private getExpenses(): Observable<Expense[]> {
    return this.expensesService
      .getExpenses();
  }
}
