import { Injectable } from "@angular/core";
import { BillingService } from "@app/services/billing.service";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { Billing, Expense, ExpenseCategory } from "@models";
import { Store } from "@ngrx/store";
import { MatSnackBar } from "@angular/material/snack-bar";
import { combineLatest, firstValueFrom, map, Observable, of } from "rxjs";
import { ExpensesService, FirestoreService } from "@app/services";
import { query, Timestamp, where } from "firebase/firestore";
import moment from "moment";

export interface BillingEditFacadeModel {
  userId: string | undefined;
}

export const initialState: BillingEditFacadeModel = {
  userId: "",
};

@Injectable()
export class BillingEditFacade {
  vm$: Observable<BillingEditFacadeModel> = of(initialState);

  constructor(
    private billingService: BillingService,
    private store: Store<AppState>,
    private snackbarService: MatSnackBar,
    private expensesService: ExpensesService
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<BillingEditFacadeModel> {
    return combineLatest([this.store.select(selectAuthenticatedUser)]).pipe(
      map(([user]) => {
        return {
          userId: user.id,
        };
      })
    );
  }

  getPayment(billing: Partial<Billing>): Observable<Expense[]> {
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    return this.expensesService.getExpensesByQuery((collectionRef) =>
      query(
        collectionRef,
        where("userId", "==", billing.userId),
        where("category", "==", ExpenseCategory.BILLS),
        where("billingId", "==", billing.id),
        where("expenseDate", ">=", Timestamp.fromDate(startOfMonth)),
        where("expenseDate", "<=", Timestamp.fromDate(endOfMonth))
      )
    );
  }

  async payBill(billingItem: Partial<Billing>): Promise<void> {
    const payments = await firstValueFrom(this.getPayment(billingItem));
    console.log(payments);

    if (payments.length > 0) {
      this.snackbarService.open(
        "This bill has already been paid for this month.",
        "Close",
        {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        }
      );
      return;
    }

    try {
      await this.expensesService.addExpenses({
        userId: billingItem.userId,
        billingId: billingItem.id,
        name: billingItem.name,
        amount: billingItem.price,
        category: ExpenseCategory.BILLS,
        expenseDate: Timestamp.now(),
      });

      this.snackbarService.open("Bill paid successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    } catch (error) {
      console.error("Error paying bill:", error);
      this.snackbarService.open(
        "Failed to pay bill. Please try again.",
        "Close",
        {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        }
      );
      throw error;
    }
  }

  async updateBill(billingItem: Partial<Billing>): Promise<void> {
    try {
      await this.billingService.updateBill(billingItem);
      this.snackbarService.open("Bill updated successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    } catch (error) {
      console.error("Error updating bill:", error);
      this.snackbarService.open(
        "Failed to update bill. Please try again.",
        "Close",
        {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        }
      );
      throw error;
    }
  }

  async deleteBill(billingItem: Partial<Billing>): Promise<void> {
    try {
      await this.billingService.deleteBill(billingItem);
      this.snackbarService.open("Bill deleted successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    } catch (error) {
      console.error("Error deleting bill:", error);
      this.snackbarService.open(
        "Failed to delete bill. Please try again.",
        "Close",
        {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        }
      );
      throw error;
    }
  }
}
