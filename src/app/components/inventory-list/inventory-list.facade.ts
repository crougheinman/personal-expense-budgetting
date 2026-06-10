import { Injectable } from "@angular/core";
import {  Inventory } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, startWith, switchMap } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";
import { InventoryService } from "@app/services/inventory.service";
import { MatSnackBar } from "@angular/material/snack-bar";

export interface InventoryListFacadeModel {
  inventoryItems?: Inventory[];
  filteredCount: number;
  totalCount: number;
}

export const initialState: InventoryListFacadeModel = {
  inventoryItems: [],
  filteredCount: 0,
  totalCount: 0,
};

@Injectable()
export class InventoryListFacade {
  vm$: Observable<InventoryListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private inventoryService: InventoryService,
    private store: Store<AppState>,
    private snackbarService: MatSnackBar,
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<InventoryListFacadeModel> {
    return combineLatest([
      this.getInventoryItems(),
      this.searchKey$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([inventoryItems, searchKey]) => {
        let filteredItems = inventoryItems;
        
        // Filter by search key
        if (searchKey.length > 0) {
          filteredItems = filteredItems.filter((item) => 
            item.name.toLowerCase().includes(searchKey.toLowerCase()) ||
            item.store.toLowerCase().includes(searchKey.toLowerCase())
          );
        }
        
        return {
          inventoryItems: filteredItems,
          filteredCount: filteredItems.length,
          totalCount: inventoryItems.length,
        };
      }),
      startWith(initialState),
    );
  }

  private getInventoryItems(): Observable<Inventory[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) => {
        if (!user?.id) {
          return of([] as Inventory[]);
        }
        return this.inventoryService.getInventoryItemsByUserId(user.id);
      }),
      // Server query is filtered by userId (no orderBy, so no index needed);
      // sort newest-first on the client.
      map((items) =>
        [...items].sort(
          (a, b) => (b.updated?.seconds ?? 0) - (a.updated?.seconds ?? 0)
        )
      )
    );
  }

  updateSearchKey(value: string) : void {
    this.searchKey$.next(value);
  }
}
