import { Injectable } from '@angular/core';
import { InventoryService } from '@app/services/inventory.service';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Inventory } from '@models'
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of } from 'rxjs';

export interface InventoryEditFacadeModel {
    userId: string | undefined,
};

export const initialState: InventoryEditFacadeModel = {
    userId: '',
};

@Injectable()
export class InventoryEditFacade {
    vm$: Observable<InventoryEditFacadeModel> = of(initialState);
    constructor(
        private inventoryService: InventoryService,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<InventoryEditFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
        ]).pipe(
            map(([user]) => {
                return {
                    userId: user.id,
                }
            })
        );
    }

    async editInventoryItem(inventoryItem: Partial<Inventory>): Promise<void> {
        await this.inventoryService.updateInventoryItem(inventoryItem);
    }

    async deleteInventoryItem(inventoryItem: Partial<Inventory>): Promise<void> {
        await this.inventoryService.deleteInventoryItem(inventoryItem);
    }
}