import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  BillingListFacade,
  BillingListFacadeModel,
  initialState,
} from "./billing-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  Billing
} from "@app/models";
import { BillingEditComponent } from "../billing-edit/billing-edit.component";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: "component-billing-list",
  templateUrl: "./billing-list.component.html",
  styleUrl: "./billing-list.component.scss",
  providers: [BillingListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingListComponent {
  vm$: Observable<BillingListFacadeModel> = of(initialState);

  constructor(
    private facade: BillingListFacade,
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

  onItemClick(billingItem: Billing): void {
    this.bottomSheet.open(BillingEditComponent, {
      data: {
        ...billingItem,
      },
    });
  }

  trackById(_index: number, item: Billing): string {
    return item.id ?? String(_index);
  }

  confirmDelete(item: Billing): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Bill",
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
        await this.facade.deleteBill(item);
        this.snackBar.open(`Deleted "${item.name}".`, "Close", {
          duration: 3000,
          panelClass: ["success-snackbar"],
        });
      } catch (error) {
        console.error("Failed to delete bill:", error);
        this.snackBar.open("Failed to delete the bill.", "Close", {
          duration: 3000,
          panelClass: ["error-snackbar"],
        });
      }
    });
  }
}
