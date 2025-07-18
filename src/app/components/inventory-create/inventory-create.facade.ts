import { Injectable } from '@angular/core';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';

export interface InventoryCreateFacadeModel {
    userId: string | undefined,
    cameraOpened: boolean;
};

export const initialState: InventoryCreateFacadeModel = {
    userId: '',
    cameraOpened: false,
};

@Injectable()
export class InventoryCreateFacade {
    vm$: Observable<InventoryCreateFacadeModel> = of(initialState);
    cameraOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private expensesService: ExpensesService,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<InventoryCreateFacadeModel> {
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

    async addInventoryItem(inventoryItem: Partial<Expense>): Promise<void> {
        // For now, use the same service - can be changed later when InventoryService is created
        await this.expensesService.addExpenses(inventoryItem);
    }

    openCamera(): void {
        this.cameraOpened$.next(true);
    }

    closeCamera(): void {
        this.cameraOpened$.next(false);
    }
}