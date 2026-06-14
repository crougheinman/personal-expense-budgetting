import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import {
  BillingCreateFacade,
  BillingCreateFacadeModel,
  initialState,
} from "./billing-create.facade";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { Timestamp } from "firebase/firestore";
import { Billing, BillingType } from "@app/models";

@Component({
  selector: "app-billing-create",
  templateUrl: "./billing-create.component.html",
  styleUrl: "./billing-create.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BillingCreateFacade],
})
export class BillingCreateComponent {
  billingForm!: FormGroup;
  vm$: Observable<BillingCreateFacadeModel> = of(initialState);
  showCloseButton: boolean = false;

  constructor(
    private facade: BillingCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<BillingCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.showCloseButton = data?.showCloseButton || false;
    this.billingForm = this.formBuilder.group({
      billName: new FormControl<string | null>(null, [Validators.required]),
      price: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      type: new FormControl<BillingType>("recurring", [Validators.required]),
      startDate: new FormControl<Date | null>(new Date(), [
        Validators.required,
      ]),
      terms: new FormControl<number | null>(1, [
        Validators.required,
        Validators.min(1),
      ]),
      description: new FormControl<string | null>(null),
    });

    this.vm$ = this.facade.vm$;
  }

  get billNameControl(): AbstractControl {
    return this.billingForm.get("billName") as AbstractControl;
  }
  get priceControl(): AbstractControl {
    return this.billingForm.get("price") as AbstractControl;
  }
  get typeControl(): AbstractControl {
    return this.billingForm.get("type") as AbstractControl;
  }
  get startDateControl(): AbstractControl {
    return this.billingForm.get("startDate") as AbstractControl;
  }
  get termsControl(): AbstractControl {
    return this.billingForm.get("terms") as AbstractControl;
  }
  get descriptionControl(): AbstractControl {
    return this.billingForm.get("description") as AbstractControl;
  }

  selectType(type: BillingType): void {
    this.typeControl.setValue(type);
    // Only recurring bills carry an installment count.
    if (type !== "recurring") {
      this.termsControl.setValue(1);
    }
  }

  async addBill(vm: BillingCreateFacadeModel): Promise<void> {
    if (this.billingForm.invalid) {
      return;
    }

    const type: BillingType = this.typeControl.value;
    const terms =
      type === "recurring" ? Math.max(1, this.termsControl.value || 1) : 1;
    const startDate: Date = this.startDateControl.value ?? new Date();

    try {
      const billingData: Partial<Billing> = {
        userId: vm.userId,
        name: this.billNameControl.value,
        price: this.priceControl.value,
        type,
        terms,
        startDate: Timestamp.fromDate(startDate),
        payments: [],
        description: this.descriptionControl.value ?? "",
      };

      await this.facade.addBill(billingData);
      this.matDialogRef.close();
    } catch (error) {
      console.error("Failed to add bill:", error);
    }
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}
