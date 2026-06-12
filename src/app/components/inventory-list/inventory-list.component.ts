import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  InventoryListFacade,
  InventoryListFacadeModel,
  initialState,
} from "./inventory-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  Inventory
} from "@app/models";
import { InventoryEditComponent } from "../inventory-edit/inventory-edit.component";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: "component-inventory-list",
  templateUrl: "./inventory-list.component.html",
  styleUrl: "./inventory-list.component.scss",
  providers: [InventoryListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  vm$: Observable<InventoryListFacadeModel> = of(initialState);

  constructor(
    private facade: InventoryListFacade,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.vm$ = this.facade.vm$;
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  onItemClick(inventoryItem: Inventory): void {
    this.bottomSheet.open(InventoryEditComponent, {
      data: {
        ...inventoryItem,
      },
    });
  }

  trackById(_index: number, item: Inventory): string {
    return item.id ?? String(_index);
  }

  confirmDelete(item: Inventory): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Item",
        message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }
      try {
        await this.facade.deleteInventory(item);
        this.snackBar.open(`Deleted "${item.name}".`, "Close", {
          duration: 3000,
          panelClass: ["success-snackbar"],
        });
      } catch (error) {
        console.error("Failed to delete inventory item:", error);
        this.snackBar.open("Failed to delete the item.", "Close", {
          duration: 3000,
          panelClass: ["error-snackbar"],
        });
      }
    });
  }
}
