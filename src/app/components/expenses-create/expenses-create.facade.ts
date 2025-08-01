import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '@app/services/inventory.service';
import { AppState, selectAddMode, selectAuthenticatedUser, setAddMode } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { BehaviorSubject, combineLatest, distinctUntilChanged, firstValueFrom, map, Observable, of } from 'rxjs';

export interface ExpensesCreateFacadeModel {
    userId: string | undefined,
    cameraOpened: boolean,
    addMode: boolean,
};

export const initialState: ExpensesCreateFacadeModel = {
    userId: '',
    cameraOpened: false,
    addMode: false,
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
            this.store.select(selectAddMode),
            this.cameraOpened$.asObservable().pipe(distinctUntilChanged()),
        ]).pipe(
            map(([user, addMode, cameraOpened]) => {
                return {
                    userId: user.id,
                    addMode,
                    cameraOpened,
                }
            })
        );
    }

    async addExpense(expense: Partial<Expense>, isAddStore: boolean): Promise<void> {
        await this.expensesService.addExpenses(expense);

        if (isAddStore) {
            this.inventoryService.addInventoryItem({
                name: expense.name || '',
                price: expense.amount || 0,
            });

            this.snackbarService.open('Expense added and inventory item created.', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
            });

            this.store.dispatch(setAddMode({ addMode: false }));
        }
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
            this.store.dispatch(setAddMode({ addMode: true }));
            // If not found, you can handle it accordingly (e.g., show a message)
            console.warn('No inventory item found for barcode, adding a new item at the inventory.');
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