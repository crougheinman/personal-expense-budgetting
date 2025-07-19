import { Injectable } from '@angular/core';
import { BillingService } from '@app/services/billing.service';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Billing } from '@models';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map, Observable, of } from 'rxjs';

export interface BillingEditFacadeModel {
    userId: string | undefined;
}

export const initialState: BillingEditFacadeModel = {
    userId: '',
};

@Injectable()
export class BillingEditFacade {
    vm$: Observable<BillingEditFacadeModel> = of(initialState);
    
    constructor(
        private billingService: BillingService,
        private store: Store<AppState>,
        private snackbarService: MatSnackBar,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<BillingEditFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
        ]).pipe(
            map(([user]) => {
                return {
                    userId: user.id,
                };
            })
        );
    }

    async updateBill(billingItem: Partial<Billing>): Promise<void> {
        try {
            await this.billingService.updateBill(billingItem);
            this.snackbarService.open('Bill updated successfully!', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
        } catch (error) {
            console.error('Error updating bill:', error);
            this.snackbarService.open('Failed to update bill. Please try again.', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            throw error;
        }
    }

    async deleteBill(billingItem: Partial<Billing>): Promise<void> {
        try {
            await this.billingService.deleteBill(billingItem);
            this.snackbarService.open('Bill deleted successfully!', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
        } catch (error) {
            console.error('Error deleting bill:', error);
            this.snackbarService.open('Failed to delete bill. Please try again.', 'Close', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            });
            throw error;
        }
    }
}
