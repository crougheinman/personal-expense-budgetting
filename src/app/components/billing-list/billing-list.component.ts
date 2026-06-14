import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import {
  BillingListFacade,
  BillingListFacadeModel,
  initialState,
} from "./billing-list.facade";
import { Observable, of, Subscription } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
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
  isOneTimeBilling,
  isSubscriptionBilling,
} from "@app/models";
import { BillingDetailComponent } from "../billing-detail/billing-detail.component";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { Timestamp } from "firebase/firestore";
import moment from "moment";

/** Milliseconds the one-time card fades before it is deleted. */
const ONE_TIME_FADE_MS = 1200;

@Component({
  selector: "component-billing-list",
  templateUrl: "./billing-list.component.html",
  styleUrl: "./billing-list.component.scss",
  providers: [BillingListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingListComponent implements OnInit, OnDestroy {
  vm$: Observable<BillingListFacadeModel> = of(initialState);

  /** Ids whose history log is expanded. */
  private expandedHistory = new Set<string>();
  /** Ids currently playing the one-time fade-out. */
  private removing = new Set<string>();
  /** Ids already scheduled for removal (so the stream can't re-trigger). */
  private scheduledRemoval = new Set<string>();
  private sub?: Subscription;

  constructor(
    private facade: BillingListFacade,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.vm$ = this.facade.vm$;
  }

  ngOnInit(): void {
    // Watch the stream so a fully-paid one-time bill fades out and is deleted,
    // no matter where the payment came from (card button or detail modal).
    this.sub = this.vm$.subscribe((vm) =>
      this.reconcileOneTimeRemovals(vm.billingItems)
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  /** Tap a card → open the detail modal (Pay / Edit / Delete live there). */
  openDetail(item: Billing): void {
    if (this.removing.has(item.id)) {
      return;
    }
    this.bottomSheet.open(BillingDetailComponent, { data: { ...item } });
  }

  trackById(_index: number, item: Billing): string {
    return item.id ?? String(_index);
  }

  // --- Type ---------------------------------------------------------------
  typeLabel(item: Billing): string {
    return getBillingTypeLabel(item.type);
  }
  typeIcon(item: Billing): string {
    return getBillingTypeIcon(item.type);
  }

  // --- Term tracker -------------------------------------------------------
  isSubscription(item: Billing): boolean {
    return isSubscriptionBilling(item);
  }
  termsOf(item: Billing): number {
    return getBillingTerms(item);
  }
  circlesOf(item: Billing): number[] {
    return Array.from({ length: this.termsOf(item) }, (_, i) => i);
  }
  paidCountOf(item: Billing): number {
    return getBillingPaidCount(item);
  }
  isFullyPaid(item: Billing): boolean {
    return isBillingFullyPaid(item);
  }
  isCirclePaid(item: Billing, index: number): boolean {
    return index < this.paidCountOf(item);
  }

  /** Tracker caption: "3/12" for finite bills, "3 paid" for subscriptions. */
  trackerLabel(item: Billing): string {
    if (this.isSubscription(item)) {
      return `${this.paidCountOf(item)} paid`;
    }
    return `${this.paidCountOf(item)}/${this.termsOf(item)}`;
  }

  statusLabel(item: Billing): string {
    if (this.isSubscription(item)) {
      return "Active";
    }
    return this.isFullyPaid(item) ? "Paid" : "Pending";
  }

  statusIcon(item: Billing): string {
    if (this.isSubscription(item)) {
      return "all_inclusive";
    }
    return this.isFullyPaid(item) ? "check_circle" : "schedule";
  }

  startLabel(item: Billing): string {
    if (item.startDate && typeof item.startDate.toMillis === "function") {
      return `Starts ${moment(item.startDate.toMillis()).format("MMM D, YYYY")}`;
    }
    if (item.dueDay) {
      return `Due on day ${item.dueDay}`;
    }
    return "";
  }

  // --- History log --------------------------------------------------------
  isHistoryOpen(item: Billing): boolean {
    return this.expandedHistory.has(item.id);
  }
  toggleHistory(item: Billing, event: Event): void {
    this.stop(event);
    if (this.expandedHistory.has(item.id)) {
      this.expandedHistory.delete(item.id);
    } else {
      this.expandedHistory.add(item.id);
    }
  }
  paymentsOf(item: Billing): BillingPayment[] {
    return [...(item.payments ?? [])].sort(
      (a, b) => this.toMillis(a.timestamp) - this.toMillis(b.timestamp)
    );
  }
  formatPaymentDate(ts: Timestamp): string {
    const ms = this.toMillis(ts);
    return ms ? moment(ms).format("MMM D, YYYY · h:mm A") : "—";
  }

  // --- Removal animation --------------------------------------------------
  isRemoving(item: Billing): boolean {
    return this.removing.has(item.id);
  }

  private reconcileOneTimeRemovals(items: Billing[]): void {
    for (const item of items) {
      if (
        isOneTimeBilling(item) &&
        isBillingFullyPaid(item) &&
        !this.scheduledRemoval.has(item.id)
      ) {
        this.scheduledRemoval.add(item.id);
        this.removing.add(item.id);
        this.cdr.markForCheck();

        setTimeout(() => {
          this.facade
            .deleteBill(item)
            .catch((error) =>
              console.error("Failed to remove paid one-time bill:", error)
            );
          this.removing.delete(item.id);
          this.cdr.markForCheck();
        }, ONE_TIME_FADE_MS);
      }
    }
  }

  // --- Actions ------------------------------------------------------------
  payBill(item: Billing, event: Event): void {
    this.stop(event);
    if (this.isFullyPaid(item) || this.removing.has(item.id)) {
      this.snackBar.open(`"${item.name}" is fully paid.`, "Close", {
        duration: 3000,
        panelClass: ["success-snackbar"],
      });
      return;
    }
    this.facade.payBill(item);
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

  /** Stops a pointer/click from bubbling to the card's swipe/tap gesture. */
  stop(event: Event): void {
    event.stopPropagation();
  }

  private toMillis(ts: Timestamp | undefined): number {
    return ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
  }
}
