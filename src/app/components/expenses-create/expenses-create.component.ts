import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { ExpensesCreateFacade, ExpensesCreateFacadeModel, initialState } from "./expenses-create.facade";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import moment from "moment";
import { Timestamp } from "firebase/firestore";

@Component({
  selector: "app-expenses-create.component",
  templateUrl: "./expenses-create.component.html",
  styleUrl: "./expenses-create.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesCreateFacade],
})
export class ExpensesCreateComponent {
  expensesForm!: FormGroup;
  vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);
  capturedImageUrl: string | null = null;
  showCloseButton: boolean = false;

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.vm$ = this.facade.vm$;
    this.showCloseButton = data?.showCloseButton || false;
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null),
      expenseAmount: new FormControl<string | null>(null),
    });
    this.nameControl.setValue("");
    this.amountControl.setValue("");
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  async addExpenses(vm: ExpensesCreateFacadeModel): Promise<void> {
    await this.facade.addExpense({
      userId: vm.userId,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      expenseDate: Timestamp.fromDate(moment().toDate()),
    });
    this.matDialogRef.close();
  }

  async onBarcodeScanned(barcode: string): Promise<void> {
    // Handle the scanned barcode - populate the expense name field
    const scannedData = await this.facade.onBarcodeScanned(barcode);
    if (scannedData) {
      this.nameControl.setValue(scannedData.name);
      this.amountControl.setValue(scannedData.amount);
    }
  }

  onBarcodeScanError(error: string): void {
    console.error('Barcode scan error:', error);
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}