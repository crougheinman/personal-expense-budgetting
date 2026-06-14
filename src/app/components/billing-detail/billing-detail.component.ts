import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  Billing,
  BillingPayment,
  getBillingPaidCount,
  getBillingTerms,
  getBillingTypeIcon,
  getBillingTypeLabel,
  isBillingFullyPaid,
  isSubscriptionBilling,
} from "@app/models";
import { BillingService } from "@app/services/billing.service";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { BillingEditComponent } from "../billing-edit/billing-edit.component";
import { Timestamp } from "firebase/firestore";
import moment from "moment";

/**
 * Read-only details of a single bill, shown when a card is tapped. Carries the
 * Pay, Edit and Delete actions. Paying drives the same shared service path as
 * the card button; the list reacts to the Firestore stream (including the
 * one-time fade-out removal).
 */
@Component({
  selector: "component-billing-detail",
  standalone: false,
  templateUrl: "./billing-detail.component.html",
  styleUrl: "./billing-detail.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingDetailComponent {
  /** Local copy kept in sync after a payment so the tracker updates live. */
  bill: Billing;
  paying = false;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) data: Billing,
    private bottomSheetRef: MatBottomSheetRef<BillingDetailComponent>,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private billingService: BillingService
  ) {
    this.bill = { ...data };
  }

  get typeLabel(): string {
    return getBillingTypeLabel(this.bill.type);
  }
  get typeIcon(): string {
    return getBillingTypeIcon(this.bill.type);
  }
  get terms(): number {
    return getBillingTerms(this.bill);
  }
  get paidCount(): number {
    return getBillingPaidCount(this.bill);
  }
  get fullyPaid(): boolean {
    return isBillingFullyPaid(this.bill);
  }
  get isSubscription(): boolean {
    return isSubscriptionBilling(this.bill);
  }

  /** "3/12" for finite bills, "3 paid" for open-ended subscriptions. */
  get progressLabel(): string {
    return this.isSubscription
      ? `${this.paidCount} paid`
      : `${this.paidCount}/${this.terms}`;
  }

  circles(): number[] {
    return Array.from({ length: this.terms }, (_, i) => i);
  }
  isCirclePaid(index: number): boolean {
    return index < this.paidCount;
  }

  get startLabel(): string {
    const sd = this.bill.startDate;
    if (sd && typeof sd.toMillis === "function") {
      return moment(sd.toMillis()).format("MMM D, YYYY");
    }
    if (this.bill.dueDay) {
      return `Due on day ${this.bill.dueDay}`;
    }
    return "—";
  }

  payments(): BillingPayment[] {
    return [...(this.bill.payments ?? [])].sort(
      (a, b) => this.toMillis(a.timestamp) - this.toMillis(b.timestamp)
    );
  }

  formatPaymentDate(ts: Timestamp): string {
    const ms = this.toMillis(ts);
    return ms ? moment(ms).format("MMM D, YYYY · h:mm A") : "—";
  }

  // --- Actions ------------------------------------------------------------
  async pay(): Promise<void> {
    if (this.paying) {
      return;
    }
    if (this.fullyPaid) {
      this.snackBar.open(`"${this.bill.name}" is fully paid.`, "Close", {
        duration: 3000,
        panelClass: ["success-snackbar"],
      });
      return;
    }

    this.paying = true;
    try {
      const result = await this.billingService.payTerm(this.bill);
      this.snackBar.open(
        result.fullyPaid
          ? `Paid "${this.bill.name}" — fully settled! 🎉`
          : `Paid "${this.bill.name}" — ${result.remaining} term${
              result.remaining === 1 ? "" : "s"
            } left.`,
        "Close",
        { duration: 3000, panelClass: ["success-snackbar"] }
      );
      // The list reacts to the stream (one-time bills fade out + delete).
      this.bottomSheetRef.dismiss();
    } catch (error) {
      console.error("Failed to pay bill:", error);
      this.snackBar.open("Failed to pay the bill.", "Close", {
        duration: 3000,
        panelClass: ["error-snackbar"],
      });
    } finally {
      this.paying = false;
    }
  }

  edit(): void {
    this.bottomSheetRef.dismiss();
    this.bottomSheet.open(BillingEditComponent, {
      data: { ...this.bill },
      panelClass: "fullscreen-sheet",
    });
  }

  remove(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Bill",
        message: `Are you sure you want to delete "${this.bill.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }
      try {
        await this.billingService.deleteBill({ id: this.bill.id });
        this.bottomSheetRef.dismiss();
        this.snackBar.open(`Deleted "${this.bill.name}".`, "Close", {
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

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  private toMillis(ts: Timestamp | undefined): number {
    return ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
  }
}
