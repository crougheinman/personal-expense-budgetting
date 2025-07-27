import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { MatDialog } from "@angular/material/dialog";
import { BillingEditFacade } from "./billing-edit.facade";
import { Billing, Expense } from "@app/models";
import { Timestamp } from "firebase/firestore";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";

interface InputData {
  id?: string;
  userId?: string;
  name?: string;
  price?: number;
  description?: string;
  dueDay?: Timestamp;
}

@Component({
  selector: "component-billing-edit",
  standalone: false,
  templateUrl: "./billing-edit.component.html",
  styleUrl: "./billing-edit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BillingEditFacade],
})
export class BillingEditComponent implements OnDestroy{
  private onDestroy = new Subject<void>();
  isNotYetPaid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  billingForm!: FormGroup;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: InputData,
    private facade: BillingEditFacade,
    private formBuilder: FormBuilder,
    private matBottomSheetRef: MatBottomSheetRef<BillingEditComponent>,
    private dialog: MatDialog
  ) {
    const { name, price, description, dueDay } = data;
    this.billingForm = this.formBuilder.group({
      billName: new FormControl<string | null>(null, [Validators.required]),
      billPrice: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      billDescription: new FormControl<string | null>(null),
      billDueDay: new FormControl<Date | null>(null, [Validators.required]),
    });

    this.nameControl.setValue(name);
    this.priceControl.setValue(price);
    this.descriptionControl.setValue(description);
    this.dueDayControl.setValue(dueDay);

    this.facade.getPayment(data as Partial<Billing>)
      .pipe(takeUntil(this.onDestroy))
      .subscribe((payments) => {
        console.log({payments});
        
        if (payments.length > 0) {
          this.isNotYetPaid$.next(false);
          console.log('paid');
          
        } else {
          this.isNotYetPaid$.next(true);
          console.log('unpaid');
          
        }
      })
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  get nameControl(): AbstractControl {
    return this.billingForm.get("billName") as AbstractControl;
  }

  get priceControl(): AbstractControl {
    return this.billingForm.get("billPrice") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.billingForm.get("billDescription") as AbstractControl;
  }

  get dueDayControl(): AbstractControl {
    return this.billingForm.get("billDueDay") as AbstractControl;
  }

  async payBill(): Promise<void> {
    if (this.billingForm.invalid) {
      return;
    }

    try {
      const billingData: Partial<Billing> = {
        id: this.data.id,
        userId: this.data.userId,
        name: this.nameControl.value,
        price: this.priceControl.value,
        description: this.descriptionControl.value,
        dueDay: this.dueDayControl.value,
      };

      this.facade.payBill(billingData);

      this.matBottomSheetRef.dismiss();
    } catch (error) {
      console.error("Failed to pay bill:", error);
    }
  }

  async updateBill(): Promise<void> {
    if (this.billingForm.invalid) {
      return;
    }

    try {
      const billingData: Partial<Billing> = {
        id: this.data.id,
        name: this.nameControl.value,
        price: this.priceControl.value,
        description: this.descriptionControl.value,
        dueDay: this.dueDayControl.value,
      };

      await this.facade.updateBill(billingData);
      this.matBottomSheetRef.dismiss();
    } catch (error) {
      console.error("Failed to update bill:", error);
    }
  }

  async deleteBill(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Bill',
        message: `Are you sure you want to delete "${this.nameControl.value}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const billingData: Partial<Billing> = {
            id: this.data.id,
          };

          await this.facade.deleteBill(billingData);
          this.matBottomSheetRef.dismiss();
        } catch (error) {
          console.error("Failed to delete bill:", error);
        }
      }
    });
  }
}
