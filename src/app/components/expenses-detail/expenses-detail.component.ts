import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  Expense,
  getExpenseCategoryIcon,
  getCategoryDisplayName,
} from "@app/models";
import { ExpensesService } from "@services";
import { BillingService } from "@app/services/billing.service";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { ExpensesEditComponent } from "../expenses-edit/expenses-edit.component";
import moment from "moment";

/**
 * Read-only details of a single expense, shown when a row is tapped. Carries
 * Edit (opens the edit sheet) and Delete (confirms, then removes) actions —
 * tapping a row no longer jumps straight into editing.
 */
@Component({
  selector: "component-expenses-detail",
  standalone: false,
  templateUrl: "./expenses-detail.component.html",
  styleUrl: "./expenses-detail.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesDetailComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public expense: Expense,
    private bottomSheetRef: MatBottomSheetRef<ExpensesDetailComponent>,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private expensesService: ExpensesService,
    private billingService: BillingService,
  ) {}

  get icon(): string {
    return getExpenseCategoryIcon(this.expense.category ?? "default");
  }

  get categoryName(): string {
    return getCategoryDisplayName(this.expense.category ?? "default");
  }

  get dateLabel(): string {
    const d = this.expense.expenseDate?.toDate();
    return d ? moment(d).format("dddd, MMM D, YYYY") : "—";
  }

  get timeLabel(): string {
    const d = this.expense.expenseDate?.toDate();
    return d ? moment(d).format("h:mm A") : "—";
  }

  /** Swap this sheet for the edit form, pre-filled with the expense. */
  onEdit(): void {
    this.bottomSheet.open(ExpensesEditComponent, { data: { ...this.expense } });
  }

  onDelete(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Expense",
        message: `Are you sure you want to delete "${this.expense.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }
      try {
        await this.expensesService.deleteExpense(this.expense);
        // If this expense came from a bill payment, drop that history entry too.
        await this.billingService.removePaymentForExpense(this.expense);
        this.bottomSheetRef.dismiss();
        this.snackBar.open(`Deleted "${this.expense.name}".`, "Close", {
          duration: 3000,
          panelClass: ["success-snackbar"],
        });
      } catch (error) {
        console.error("Failed to delete expense:", error);
        this.snackBar.open("Failed to delete the expense.", "Close", {
          duration: 3000,
          panelClass: ["error-snackbar"],
        });
      }
    });
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}
