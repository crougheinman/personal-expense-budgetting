import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { BillingCreateFacade, BillingCreateFacadeModel, initialState } from "./billing-create.facade";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { tap, Observable, of } from "rxjs";
import { Timestamp } from "firebase/firestore";
import { Billing } from "@app/models";

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
      price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
      dueDay: new FormControl<number | null>(null, [Validators.required]),
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

  get dueDayControl(): AbstractControl {
    return this.billingForm.get("dueDay") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.billingForm.get("description") as AbstractControl;
  }

  async addBill(vm: BillingCreateFacadeModel): Promise<void> {
    if (this.billingForm.invalid) {
      return;
    }

    try {
      const billingData: Partial<Billing> = {
        userId: vm.userId,
        name: this.billNameControl.value,
        price: this.priceControl.value,
        dueDay: this.dueDayControl.value,
        description: this.descriptionControl.value,
      };
      
      await this.facade.addBill(billingData);
      this.matDialogRef.close();
    } catch (error) {
      console.error('Failed to add bill:', error);
    }
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}
