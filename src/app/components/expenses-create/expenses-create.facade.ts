import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '@app/services/inventory.service';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { BehaviorSubject, combineLatest, distinctUntilChanged, firstValueFrom, map, Observable, of } from 'rxjs';

export interface ExpensesCreateFacadeModel {
    userId: string | undefined,
    cameraOpened: boolean;
};

export const initialState: ExpensesCreateFacadeModel = {
    userId: '',
    cameraOpened: false,
};

@Injectable()
export class ExpensesCreateFacade {
    vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);
    cameraOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private expensesService: ExpensesService,
        private inventoryService: InventoryService,
        private snackbarService: MatSnackBar,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<ExpensesCreateFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
            this.cameraOpened$.asObservable().pipe(distinctUntilChanged()),
        ]).pipe(
            map(([user, cameraOpened]) => {
                return {
                    userId: user.id,
                    cameraOpened,
                }
            })
        );
    }

    async addExpense(expense: Partial<Expense>): Promise<void> {
        await this.expensesService.addExpenses(expense);
    }

    async onBarcodeScanned(barcode: string): Promise<Partial<Expense>> {
        // check if the bacode is existing in the inventory by using query
        const inventoryItem = await firstValueFrom(this.inventoryService.getInventoryItemByBarcode(barcode));
        if (inventoryItem.length > 0) {
            // If found, populate the expense name field with the inventory item name
            const item = inventoryItem[0];
            return {
                name: item.name,
                amount: item.price,
                category: 'default',
                description: item.description,
            };
        } else {
            // If not found, you can handle it accordingly (e.g., show a message)
            console.warn('No inventory item found for barcode:', barcode);
            this.snackbarService.open('No inventory item found for this barcode.', 'Close', {
                duration: 3000,
                panelClass: ['warning-snackbar']
            });
        }

        return {} as Partial<Expense>;

    }

    openCamera(): void {
        this.cameraOpened$.next(true);
    }

    closeCamera(): void {
        this.cameraOpened$.next(false);
    }
}