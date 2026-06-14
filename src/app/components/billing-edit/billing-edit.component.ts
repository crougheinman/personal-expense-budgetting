import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
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
import { Billing, BillingType } from "@app/models";
import { Timestamp } from "firebase/firestore";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: "component-billing-edit",
  standalone: false,
  templateUrl: "./billing-edit.component.html",
  styleUrl: "./billing-edit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BillingEditFacade],
})
export class BillingEditComponent {
  billingForm!: FormGroup;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: Partial<Billing>,
    private facade: BillingEditFacade,
    private formBuilder: FormBuilder,
    private matBottomSheetRef: MatBottomSheetRef<BillingEditComponent>,
    private dialog: MatDialog
  ) {
    const { name, price, description, type, startDate, terms } = data;
    const start =
      startDate && typeof startDate.toDate === "function"
        ? startDate.toDate()
        : new Date();

    this.billingForm = this.formBuilder.group({
      billName: new FormControl<string | null>(null, [Validators.required]),
      billPrice: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      billType: new FormControl<BillingType>("recurring", [
        Validators.required,
      ]),
      billStartDate: new FormControl<Date | null>(start, [
        Validators.required,
      ]),
      billTerms: new FormControl<number | null>(1, [
        Validators.required,
        Validators.min(1),
      ]),
      billDescription: new FormControl<string | null>(null),
    });

    // Map the legacy 'fixed' type onto the new 'subscription'.
    const normalizedType: BillingType =
      (type as string) === "fixed"
        ? "subscription"
        : (type as BillingType) ?? "recurring";

    this.nameControl.setValue(name);
    this.priceControl.setValue(price);
    this.typeControl.setValue(normalizedType);
    this.termsControl.setValue(normalizedType === "onetime" ? 1 : terms ?? 1);
    this.descriptionControl.setValue(description);
  }

  get nameControl(): AbstractControl {
    return this.billingForm.get("billName") as AbstractControl;
  }
  get priceControl(): AbstractControl {
    return this.billingForm.get("billPrice") as AbstractControl;
  }
  get typeControl(): AbstractControl {
    return this.billingForm.get("billType") as AbstractControl;
  }
  get startDateControl(): AbstractControl {
    return this.billingForm.get("billStartDate") as AbstractControl;
  }
  get termsControl(): AbstractControl {
    return this.billingForm.get("billTerms") as AbstractControl;
  }
  get descriptionControl(): AbstractControl {
    return this.billingForm.get("billDescription") as AbstractControl;
  }

  selectType(type: BillingType): void {
    this.typeControl.setValue(type);
    // Only recurring bills carry an installment count.
    if (type !== "recurring") {
      this.termsControl.setValue(1);
    }
  }

  async updateBill(): Promise<void> {
    if (this.billingForm.invalid) {
      return;
    }

    const type: BillingType = this.typeControl.value;
    const terms =
      type === "recurring" ? Math.max(1, this.termsControl.value || 1) : 1;
    const startDate: Date = this.startDateControl.value ?? new Date();

    try {
      const billingData: Partial<Billing> = {
        id: this.data.id,
        name: this.nameControl.value,
        price: this.priceControl.value,
        type,
        terms,
        startDate: Timestamp.fromDate(startDate),
        description: this.descriptionControl.value ?? "",
      };

      await this.facade.updateBill(billingData);
      this.matBottomSheetRef.dismiss();
    } catch (error) {
      console.error("Failed to update bill:", error);
    }
  }

  async deleteBill(): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Bill",
        message: `Are you sure you want to delete "${this.nameControl.value}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      try {
        await this.facade.deleteBill({ id: this.data.id });
        this.matBottomSheetRef.dismiss();
      } catch (error) {
        console.error("Failed to delete bill:", error);
      }
    });
  }

  close(): void {
    this.matBottomSheetRef.dismiss();
  }
}
