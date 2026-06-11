import { Injectable } from "@angular/core";
import { ExpensesService } from "@services";
import { Expense } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, switchMap } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";
import moment from "moment";
import { Timestamp } from "firebase/firestore";

export interface HourlyBar {
  hour: number; // 0-23
  amount: number;
  height: number; // 0-100, relative bar height
}

export interface ExpensesListFacadeModel {
  expenses?: Expense[];
  totalValue: number;
  filteredCount: number;
  totalCount: number;
  averageAmount: number;
  highestExpense: number;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  // The selected day's spending bucketed by hour (independent of list filters).
  hourly: HourlyBar[];
  dayTotal: number;
  dayCount: number;
  dayLabel: string;
  isToday: boolean;
  canGoNext: boolean;
}

export const initialState: ExpensesListFacadeModel = {
  expenses: [],
  totalValue: 0,
  filteredCount: 0,
  totalCount: 0,
  averageAmount: 0,
  highestExpense: 0,
  startDate: null,
  endDate: null,
  hourly: [],
  dayTotal: 0,
  dayCount: 0,
  dayLabel: "Today",
  isToday: true,
  canGoNext: false,
};

@Injectable()
export class ExpensesListFacade {
  vm$: Observable<ExpensesListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  selectedCategory$: BehaviorSubject<string> = new BehaviorSubject<string>('all');
  startDate$: BehaviorSubject<Timestamp> = new BehaviorSubject<Timestamp>(Timestamp.fromDate(moment().startOf('month').toDate()));
  endDate$: BehaviorSubject<Timestamp> = new BehaviorSubject<Timestamp>(Timestamp.fromDate(moment().endOf('month').toDate()));
  // Hero day navigation: 0 = today, -1 = yesterday, etc. (never positive).
  dayOffset$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

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
      this.startDate$.asObservable().pipe(distinctUntilChanged()),
      this.endDate$.asObservable().pipe(distinctUntilChanged()),
      this.selectedCategory$.asObservable().pipe(distinctUntilChanged()),
      this.dayOffset$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([expenses, searchKey, startDate, endDate, selectedCategory, dayOffset]) => {
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

        // Scope the list (and its summary metrics) to the day selected via the
        // hero's prev/next arrows, so changing the day updates the items, count,
        // total amount and highest expense together.
        const day = moment().add(dayOffset, "days");
        const dayStart = day.clone().startOf("day");
        const dayEnd = day.clone().endOf("day");
        filteredExpenses = filteredExpenses.filter((expense) => {
          const date = this.dateOf(expense);
          return date
            ? moment(date).isBetween(dayStart, dayEnd, undefined, "[]")
            : false;
        });

        // Calculate additional metrics
        const averageAmount = filteredExpenses.length > 0 
          ? filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length 
          : 0;
        
        const highestExpense = filteredExpenses.length > 0 
          ? Math.max(...filteredExpenses.map(expense => expense.amount)) 
          : 0;

        const totalValue = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Selected day's spending by hour — from the UNFILTERED user expenses.
        const { hourly, dayTotal, dayCount } = this.buildHourly(
          expenses,
          dayOffset
        );

        return {
          expenses: filteredExpenses,
          totalValue,
          filteredCount: filteredExpenses.length,
          totalCount: expenses.length,
          averageAmount,
          highestExpense,
          startDate,
          endDate,
          hourly,
          dayTotal,
          dayCount,
          dayLabel: this.dayLabel(dayOffset),
          isToday: dayOffset === 0,
          canGoNext: dayOffset < 0, // can't navigate into the future
        };
      })
    );
  }

  /**
   * Buckets a single day's expenses into 24 hourly bars, normalised to bar
   * heights. `offset` is days relative to today (0 = today, -1 = yesterday).
   */
  private buildHourly(
    expenses: Expense[],
    offset: number
  ): { hourly: HourlyBar[]; dayTotal: number; dayCount: number } {
    const day = moment().add(offset, "days");
    const startOfDay = day.clone().startOf("day");
    const endOfDay = day.clone().endOf("day");
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      amount: 0,
    }));
    let dayCount = 0;

    for (const expense of expenses) {
      const date = this.dateOf(expense);
      if (!date) {
        continue;
      }
      const m = moment(date);
      if (m.isSameOrAfter(startOfDay) && m.isSameOrBefore(endOfDay)) {
        buckets[m.hour()].amount += expense.amount || 0;
        dayCount++;
      }
    }

    const max = Math.max(...buckets.map((b) => b.amount), 1);
    const hourly = buckets.map((b) => ({
      hour: b.hour,
      amount: b.amount,
      height: Math.round((b.amount / max) * 100),
    }));
    const dayTotal = buckets.reduce((sum, b) => sum + b.amount, 0);

    return { hourly, dayTotal, dayCount };
  }

  private dayLabel(offset: number): string {
    if (offset === 0) return "Today";
    if (offset === -1) return "Yesterday";
    return moment().add(offset, "days").format("ddd, MMM D");
  }

  private dateOf(expense: Expense): Date | null {
    if (expense.expenseDate) {
      return expense.expenseDate.toDate();
    }
    if (expense.created) {
      return expense.created.toDate();
    }
    return null;
  }

  private getUserExpenses(): Observable<Expense[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) => {
        if (!user?.id) {
          return of([] as Expense[]);
        }
        return this.expensesService.getExpensesByUserId(user.id);
      }),
      // Server query is filtered by userId (no orderBy, so no index needed);
      // sort newest-first on the client.
      map((expenses) =>
        [...expenses].sort(
          (a, b) => (b.updated?.seconds ?? 0) - (a.updated?.seconds ?? 0)
        )
      )
    );
  }

  previousDay(): void {
    this.dayOffset$.next(this.dayOffset$.value - 1);
  }

  nextDay(): void {
    // Don't navigate past today.
    if (this.dayOffset$.value < 0) {
      this.dayOffset$.next(this.dayOffset$.value + 1);
    }
  }

  updateSearchKey(value: string) : void {
    this.searchKey$.next(value);
  }

  updateStartDate(value: string): void {
    this.startDate$.next(Timestamp.fromDate(moment(value).toDate()));
    
  }

  updateEndDate(value: string): void {
    this.endDate$.next(Timestamp.fromDate(moment(value).toDate()));
  }

  updateSelectedCategory(category: string): void {
    this.selectedCategory$.next(category);
  }

  updateDateRange(startDate: string, endDate: string): void {
    this.startDate$.next(Timestamp.fromDate(moment(startDate).toDate()));
    this.endDate$.next(Timestamp.fromDate(moment(endDate).toDate()));
  }
}
