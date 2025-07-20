import { Injectable } from "@angular/core";
import { InventoryService } from "@app/services/inventory.service";
import {
  AppState,
  selectAuthenticatedUser,
  selectedStore,
  setStore,
} from "@app/store";
import { Inventory } from "@models";
import { Store } from "@ngrx/store";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
} from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { InventoryEditComponent } from "../inventory-edit/inventory-edit.component";

export interface InventoryCreateFacadeModel {
  userId: string | undefined;
  cameraOpened: boolean;
  selectedStore: string;
}

export const initialState: InventoryCreateFacadeModel = {
  userId: "",
  cameraOpened: false,
  selectedStore: "",
};

@Injectable()
export class InventoryCreateFacade {
  vm$: Observable<InventoryCreateFacadeModel> = of(initialState);
  cameraOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private inventoryService: InventoryService,
    private store: Store<AppState>,
    private snackbarService: MatSnackBar,
    private bottomSheet: MatBottomSheet
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<InventoryCreateFacadeModel> {
    return combineLatest([
      this.store.select(selectAuthenticatedUser),
      this.cameraOpened$.asObservable().pipe(distinctUntilChanged()),
      this.store.select(selectedStore),
    ]).pipe(
      map(([user, cameraOpened, selectedStore]) => {
        return {
          userId: user.id,
          cameraOpened,
          selectedStore,
        };
      })
    );
  }

  async addInventoryItem(inventoryItem: Partial<Inventory>): Promise<void> {
    try {
      await this.inventoryService.addInventoryItem(inventoryItem);
      this.store.dispatch(setStore({ store: inventoryItem.store as string }));
      this.snackbarService.open("Inventory item added successfully!", "Close", {
        duration: 3000,
        panelClass: ["success-snackbar"],
      });
    } catch (error) {
      console.error("Error adding inventory item:", error);
      this.snackbarService.open(
        "Failed to add inventory item. Please try again.",
        "Close",
        {
          duration: 5000,
          panelClass: ["error-snackbar"],
        }
      );
      throw error; // Re-throw to allow component to handle if needed
    }
  }

  async onBarcodeScanned(barcode: string): Promise<Partial<Inventory> | null> {
    const inventoryItem = await firstValueFrom(
      this.inventoryService.getInventoryItemByBarcode(barcode)
    );
    if (inventoryItem.length > 0) {
      const item = inventoryItem[0];

      this.bottomSheet.open(InventoryEditComponent, {
        data: {
          ...item,
        },
      });
    } else {
      console.warn("No inventory item found for barcode:", barcode);
      this.snackbarService.open(
        "No inventory item found for this barcode.",
        "Close",
        {
          duration: 3000,
          panelClass: ["warning-snackbar"],
        }
      );
    }

    return null;
  }

  openCamera(): void {
    this.cameraOpened$.next(true);
  }

  closeCamera(): void {
    this.cameraOpened$.next(false);
  }
}
