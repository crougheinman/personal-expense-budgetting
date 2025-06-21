import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { map, Observable } from "rxjs";

export interface ExpensesListFacadeModel {
  expenses?: Expense[];
}

const initialState: ExpensesListFacadeModel = {
  expenses: [],
};

@Injectable()
export class ExpensesListFacade {
  vm$ = this.buildViewModel();
  constructor(private expensesService: ExpensesService) {}

  private buildViewModel(): Observable<ExpensesListFacadeModel> {
    return this.getExpenses().pipe(
      map((expenses: Expense[]) => {
        return {
          expenses: expenses,
        };
      })
    );
  }

  private getExpenses(): Observable<Expense[]> {
    return this.expensesService
      .getExpenses<Expense[]>();
  }
}
