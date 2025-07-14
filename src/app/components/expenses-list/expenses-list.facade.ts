import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";

export interface ExpensesListFacadeModel {
  expenses?: Expense[];
  totalValue: number;
  filteredCount: number;
  totalCount: number;
  averageAmount: number;
  highestExpense: number;
}

export const initialState: ExpensesListFacadeModel = {
  expenses: [],
  totalValue: 0,
  filteredCount: 0,
  totalCount: 0,
  averageAmount: 0,
  highestExpense: 0,
};

@Injectable()
export class ExpensesListFacade {
  vm$: Observable<ExpensesListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  selectedCategory$: BehaviorSubject<string> = new BehaviorSubject<string>('all');

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
      this.selectedCategory$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([expenses, searchKey, selectedCategory]) => {
        const totalValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        let filteredExpenses = expenses;
        
        // Filter by search key
        if (searchKey.length > 0) {
          filteredExpenses = filteredExpenses.filter((expense) => 
            expense.name.toLowerCase().includes(searchKey.toLowerCase())
          );
        }
        
        // Filter by category
        if (selectedCategory !== 'all') {
          filteredExpenses = filteredExpenses.filter((expense) => 
            expense.category?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        
        // Calculate additional metrics
        const averageAmount = filteredExpenses.length > 0 
          ? filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length 
          : 0;
        
        const highestExpense = filteredExpenses.length > 0 
          ? Math.max(...filteredExpenses.map(expense => expense.amount)) 
          : 0;
        
        return {
          expenses: filteredExpenses,
          totalValue,
          filteredCount: filteredExpenses.length,
          totalCount: expenses.length,
          averageAmount,
          highestExpense,
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

  updateSelectedCategory(category: string): void {
    this.selectedCategory$.next(category);
  }
}
