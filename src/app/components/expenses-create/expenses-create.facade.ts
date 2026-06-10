import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '@app/services/inventory.service';
import { AppState, selectAddMode, selectAuthenticatedUser, setAddMode } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';

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

    openCamera(): void {
        this.cameraOpened$.next(true);
    }

    closeCamera(): void {
        this.cameraOpened$.next(false);
    }
}