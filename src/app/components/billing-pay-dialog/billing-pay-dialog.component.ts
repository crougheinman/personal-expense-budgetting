import { Component, Inject } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface BillingPayDialogData {
  name: string;
  defaultAmount: number;
}

/**
 * Asks how much to pay for a subscription this cycle (subscriptions can cost a
 * different amount each month). Closes with the confirmed number, or
 * `undefined` if cancelled. No running balance is shown — each month stands
 * alone.
 */
@Component({
  selector: "component-billing-pay-dialog",
  standalone: false,
  template: `
    <div class="pay-dialog">
      <h2 mat-dialog-title>Pay {{ data.name }}</h2>
      <mat-dialog-content>
        <p class="pay-dialog__hint">
          Confirm the amount for this month's payment.
        </p>
        <mat-form-field appearance="outline" floatLabel="auto" class="pay-dialog__field">
          <mat-label>Amount</mat-label>
          <span matTextPrefix>₱&nbsp;</span>
          <input
            #amountInput
            matInput
            type="number"
            min="0"
            step="0.01"
            [formControl]="amountControl"
            (keydown.enter)="onConfirm()"
          />
          <mat-error *ngIf="amountControl.hasError('required')">
            Amount is required
          </mat-error>
          <mat-error *ngIf="amountControl.hasError('min')">
            Amount must be 0 or more
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="amountControl.invalid"
          (click)="onConfirm()"
        >
          <mat-icon>payments</mat-icon>
          Pay
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .pay-dialog {
        min-width: 300px;
      }
      .pay-dialog__hint {
        margin: 4px 0 14px;
        color: var(--app-text-muted);
        font-size: 0.88rem;
      }
      .pay-dialog__field {
        width: 100%;
      }
      mat-dialog-actions {
        gap: 8px;
      }
      mat-dialog-actions button mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class BillingPayDialogComponent {
  amountControl: FormControl<number | null>;

  constructor(
    public dialogRef: MatDialogRef<BillingPayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BillingPayDialogData
  ) {
    this.amountControl = new FormControl<number | null>(
      data.defaultAmount ?? null,
      [Validators.required, Validators.min(0)]
    );
  }

  onConfirm(): void {
    if (this.amountControl.invalid) {
      return;
    }
    this.dialogRef.close(Number(this.amountControl.value));
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }
}
