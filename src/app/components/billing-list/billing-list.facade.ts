import { Injectable } from "@angular/core";
import {
  Billing,
  Income,
  getBillingPaidCount,
  getBillingTerms,
  getTotalMonthlyIncome,
  isBillingFullyPaid,
  isOneTimeBilling,
  isSubscriptionBilling,
} from "@models";
import { IncomeService } from "@app/services";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";
import { BillingService } from "@app/services/billing.service";
import { sortByNumericPropertiesAsc } from "@app/shared/utils";
import { MatSnackBar } from "@angular/material/snack-bar";

export interface BillingListFacadeModel {
  billingItems: Billing[];
  filteredCount: number;
  totalCount: number;
  totalAmount: number; // total obligation across all bills (price × terms)
  paidAmount: number; // total already paid (price × paidTerms)
  remainingBalance: number; // totalAmount − paidAmount
  monthObligation: number; // amount scheduled this month (subs + due installments + pending one-time)
  monthlyIncome: number; // resolved monthly salary (0 if unset)
  hasIncome: boolean; // a salary has been configured
  salaryLeft: number; // monthlyIncome − monthObligation
}

export const initialState: BillingListFacadeModel = {
  billingItems: [],
  filteredCount: 0,
  totalCount: 0,
  totalAmount: 0,
  paidAmount: 0,
  remainingBalance: 0,
  monthObligation: 0,
  monthlyIncome: 0,
  hasIncome: false,
  salaryLeft: 0,
};

@Injectable()
export class BillingListFacade {
  vm$: Observable<BillingListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
    private billingService: BillingService,
    private incomeService: IncomeService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<BillingListFacadeModel> {
    return combineLatest([
      this.getBillingItems(),
      this.searchKey$.asObservable().pipe(distinctUntilChanged()),
      this.getIncomes(),
    ]).pipe(
      map(([billingItems, searchKey, incomes]) => {
        let filteredItems = billingItems;

        if (searchKey.length > 0) {
          const key = searchKey.toLowerCase();
          filteredItems = filteredItems.filter(
            (item) =>
              item.name.toLowerCase().includes(key) ||
              (item.description &&
                item.description.toLowerCase().includes(key))
          );
        }

        // Surface unpaid bills first; sort the rest by start date / due day.
        filteredItems = sortByNumericPropertiesAsc(
          [...filteredItems],
          "dueDay"
        );

        // Totals are term-aware: a 12-term ₱1,000 bill is a ₱12,000 obligation.
        // Subscriptions are open-ended, so they add no *future* obligation —
        // only what's already been paid counts (net-zero remaining).
        let totalAmount = 0;
        let paidAmount = 0;
        // What this month asks of you: every subscription's cycle charge, one
        // installment for each active recurring plan, and any pending one-time.
        let monthObligation = 0;
        for (const item of billingItems) {
          const price = item.price || 0;
          const paidCount = getBillingPaidCount(item);
          paidAmount += price * paidCount;
          totalAmount += isSubscriptionBilling(item)
            ? price * paidCount
            : price * getBillingTerms(item);

          if (isSubscriptionBilling(item)) {
            monthObligation += price;
          } else if (isOneTimeBilling(item)) {
            if (paidCount < 1) {
              monthObligation += price;
            }
          } else if (!isBillingFullyPaid(item)) {
            monthObligation += price;
          }
        }

        const monthlyIncome = getTotalMonthlyIncome(incomes);

        return {
          billingItems: filteredItems,
          filteredCount: filteredItems.length,
          totalCount: billingItems.length,
          totalAmount,
          paidAmount,
          remainingBalance: Math.max(0, totalAmount - paidAmount),
          monthObligation,
          monthlyIncome,
          hasIncome: monthlyIncome > 0,
          salaryLeft: monthlyIncome - monthObligation,
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getIncomes(): Observable<Income[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) =>
        user?.id ? this.incomeService.getIncomesByUserId(user.id) : of([])
      )
    );
  }

  private getBillingItems(): Observable<Billing[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) => {
        if (!user) {
          return of([] as Billing[]);
        }
        return this.billingService.getBillsByUserId(user.id as string);
      })
    );
  }

  /**
   * Executes a payment via the shared service path: creates a Billings expense
   * dated today and appends a payment record — filling the next term circle
   * (the card re-renders reactively from the updated `payments` array).
   */
  async payBill(item: Billing, amountOverride?: number): Promise<void> {
    const subscription = isSubscriptionBilling(item);
    try {
      const result = await this.billingService.payTerm(item, amountOverride);

      if (result.alreadyPaid) {
        this.snackBar.open(
          subscription
            ? `"${item.name}" is already paid this month.`
            : `"${item.name}" is fully paid.`,
          "Close",
          { duration: 3000, panelClass: ["success-snackbar"] }
        );
        return;
      }

      this.snackBar.open(
        subscription
          ? `Paid "${item.name}" for this month. ✓`
          : result.fullyPaid
          ? `Paid "${item.name}" — fully settled! 🎉`
          : `Paid "${item.name}" — ${result.remaining} term${
              result.remaining === 1 ? "" : "s"
            } left.`,
        "Close",
        { duration: 3000, panelClass: ["success-snackbar"] }
      );
    } catch (error) {
      console.error("Failed to pay bill:", error);
      this.snackBar.open("Failed to pay the bill.", "Close", {
        duration: 3000,
        panelClass: ["error-snackbar"],
      });
    }
  }

  /** Permanently deletes a single bill. */
  deleteBill(item: Billing): Promise<void> {
    return this.billingService.deleteBill({ id: item.id });
  }

  updateSearchKey(value: string): void {
    this.searchKey$.next(value);
  }
}
