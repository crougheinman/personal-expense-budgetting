import { Injectable } from "@angular/core";
import { Billing, Expense, ExpenseCategory } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, startWith, switchMap } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";
import { BillingService } from "@app/services/billing.service";
import { Timestamp } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import moment from "moment";
import { ExpensesService } from "@app/services";
import { groupBy, mapValues } from "lodash";
import { sortByNumericPropertiesAsc } from "@app/shared/utils";

export interface BillingListFacadeModel {
  billingItems?: Billing[];
  billPayments?: Record<string, Expense> | null;
  filteredCount: number;
  totalCount: number;
  totalAmount: number;
  remainingBalance: number;
}

export const initialState: BillingListFacadeModel = {
  billingItems: [],
  billPayments: {},
  filteredCount: 0,
  totalCount: 0,
  totalAmount: 0,
  remainingBalance: 0,
};

@Injectable()
export class BillingListFacade {
  vm$: Observable<BillingListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private billingService: BillingService,
    private expensesService: ExpensesService,
    private store: Store<AppState>,
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<BillingListFacadeModel> {
    return combineLatest([
      this.getBillingItems(),
      this.searchKey$.asObservable().pipe(distinctUntilChanged()),
      this.getBillingExpensesForThisMonth(),
    ]).pipe(
      map(([billingItems, searchKey, billingExpenses]) => {
        let filteredItems = billingItems;
        
        // Filter by search key
        if (searchKey.length > 0) {
          filteredItems = filteredItems.filter((item) => 
            item.name.toLowerCase().includes(searchKey.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchKey.toLowerCase()))
          );
        }

        filteredItems = sortByNumericPropertiesAsc(filteredItems, 'dueDay');

        const billingExpenseMap: Record<string, Expense> | null = mapValues(groupBy(billingExpenses, 'billingId'), expenses => expenses[0]);
        
        // Calculate total amount of all bills
        const totalAmount = billingItems.reduce((sum, item) => sum + (item.price || 0), 0);
        
        // Calculate total paid amount this month
        const totalPaidAmount = billingExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        
        // Calculate remaining balance
        const remainingBalance = totalAmount - totalPaidAmount;
        
        return {
          billingItems: filteredItems,
          billPayments: billingExpenseMap,
          filteredCount: filteredItems.length,
          totalCount: billingItems.length,
          totalAmount: totalAmount,
          remainingBalance: remainingBalance,
        };
      }),
      startWith(initialState),
    );
  }

  private getBillingExpensesForThisMonth(): Observable<Expense[]> {
      const startOfMonth = moment().startOf("month").toDate();
      const endOfMonth = moment().endOf("month").toDate();
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }
        return this.billingService.getBillsByUserId(user.id as string).pipe(
          switchMap((bills) => {
            const billIds = bills.map(bill => bill.id);
            return this.expensesService.getExpensesByQuery((collectionRef) =>
              query(
                collectionRef,
                where("billingId", "in", billIds),
                where("expenseDate", ">=", Timestamp.fromDate(startOfMonth)),
                where("expenseDate", "<=", Timestamp.fromDate(endOfMonth)),
                where("userId", "==", user.id),
                where("category", "==", ExpenseCategory.BILLS),
              )
            );
          })
        );
      }),
    );

  }

  private getBillingItems(): Observable<Billing[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }
        return this.billingService.getBillsByUserId(user.id as string);
      }),
    );
  }

  updateSearchKey(value: string): void {
    this.searchKey$.next(value);
  }
}
