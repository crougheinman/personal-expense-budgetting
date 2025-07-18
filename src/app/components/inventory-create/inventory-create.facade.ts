import { Injectable } from '@angular/core';
import { InventoryService } from '@app/services/inventory.service';
import { AppState, selectAuthenticatedUser, selectedStore, setStore } from '@app/store';
import { Inventory } from '@models'
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';

export interface InventoryCreateFacadeModel {
    userId: string | undefined,
    cameraOpened: boolean;
    selectedStore: string;
};

export const initialState: InventoryCreateFacadeModel = {
    userId: '',
    cameraOpened: false,
    selectedStore: '',
};

@Injectable()
export class InventoryCreateFacade {
    vm$: Observable<InventoryCreateFacadeModel> = of(initialState);
    cameraOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private inventoryService: InventoryService,
        private store: Store<AppState>,
        private snackBar: MatSnackBar,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<InventoryCreateFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
            this.cameraOpened$.asObservable().pipe(distinctUntilChanged()),
            this.store.select(selectedStore)
        ]).pipe(
            map(([user, cameraOpened, selectedStore]) => {
                return {
                    userId: user.id,
                    cameraOpened,
                    selectedStore,
                }
            })
        );
    }

    async addInventoryItem(inventoryItem: Partial<Inventory>): Promise<void> {
        try {
            await this.inventoryService.addInventoryItem(inventoryItem);
            this.store.dispatch(setStore({ store: inventoryItem.store as string }));
            this.snackBar.open('Inventory item added successfully!', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
            });
        } catch (error) {
            console.error('Error adding inventory item:', error);
            this.snackBar.open('Failed to add inventory item. Please try again.', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
            });
            throw error; // Re-throw to allow component to handle if needed
        }
    }

    openCamera(): void {
        this.cameraOpened$.next(true);
    }

    closeCamera(): void {
        this.cameraOpened$.next(false);
    }
}