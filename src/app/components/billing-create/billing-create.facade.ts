import { Injectable } from "@angular/core";
import { BillingService } from "@app/services/billing.service";
import {
  AppState,
  selectAuthenticatedUser,
} from "@app/store";
import { Billing } from "@models";
import { Store } from "@ngrx/store";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  of,
} from "rxjs";

export interface BillingCreateFacadeModel {
  userId: string | undefined;
}

export const initialState: BillingCreateFacadeModel = {
  userId: "",
};

@Injectable()
export class BillingCreateFacade {
  vm$: Observable<BillingCreateFacadeModel> = of(initialState);

  constructor(
    private billingService: BillingService,
    private store: Store<AppState>,
    private snackbarService: MatSnackBar,
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<BillingCreateFacadeModel> {
    return combineLatest([
      this.store.select(selectAuthenticatedUser),
    ]).pipe(
      map(([user]) => ({
        userId: user?.id,
      }))
    );
  }

  async addBill(data: Partial<Billing>): Promise<void> {
    try {
      await this.billingService.addBill(data);
      this.snackbarService.open('Bill added successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      console.error('Error adding bill:', error);
      this.snackbarService.open('Failed to add bill. Please try again.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      throw error;
    }
  }
}
