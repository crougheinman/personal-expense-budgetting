import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from "rxjs";
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
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private expensesService: ExpensesService,
    private store: Store<AppState>
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<ExpensesListFacadeModel> {
    return combineLatest([
      this.getUserExpenses(),
      this.searchKey$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([expenses, searchKey]) => {
        const totalValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const filteredExpenses = searchKey.length > 0? 
          expenses.filter((expense) => expense.name.toLowerCase().includes(searchKey.toLowerCase())):
          expenses;
        return {
          expenses: filteredExpenses,
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

  updateSearchKey(value: string) : void {
    this.searchKey$.next(value);
  }
}
