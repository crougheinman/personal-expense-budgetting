import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { combineLatest, map, Observable, of } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";

export interface ExpensesListFacadeModel {
  expenses?: Expense[];
  totalValue: number;
}

export const initialState: ExpensesListFacadeModel = {
  expenses: [],
  totalValue: 0,
};

@Injectable()
export class ExpensesListFacade {
  vm$: Observable<ExpensesListFacadeModel> = of(initialState);

  constructor(
    private expensesService: ExpensesService,
    private store: Store<AppState>
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<ExpensesListFacadeModel> {
    return combineLatest([
      this.getUserExpenses(),
    ]).pipe(
      map(([expenses]) => {
        const totalValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
          expenses,
          totalValue,
        };
      })
    );
  }

  private getUserExpenses(): Observable<Expense[]> {
    return combineLatest([
      this.expensesService.getExpenses(),
      this.store.select(selectAuthenticatedUser),
    ]).pipe(
      map(([expenses, user]) => {
        return expenses.filter((expense) => expense.userId === user.id);
      })
    );
  }
}
