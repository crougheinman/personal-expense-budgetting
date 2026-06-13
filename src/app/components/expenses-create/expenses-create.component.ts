import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import {
  ExpensesCreateFacade,
  ExpensesCreateFacadeModel,
  initialState,
} from "./expenses-create.facade";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import moment from "moment";
import { Timestamp } from "firebase/firestore";
import { GeminiScanResult } from "@services";

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
  imageDetected: boolean = false;

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.vm$ = this.facade.vm$;
    this.showCloseButton = data?.showCloseButton || false;
    const now = new Date();
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>("", Validators.required),
      expenseAmount: new FormControl<string | null>("", Validators.required),
      expenseDate: new FormControl<Date | null>(now, Validators.required),
      expenseTime: new FormControl<string | null>(
        moment(now).format("HH:mm"),
        Validators.required,
      ),
    });
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  get expenseDateControl(): AbstractControl {
    return this.expensesForm.get("expenseDate") as AbstractControl;
  }

  get expenseTimeControl(): AbstractControl {
    return this.expensesForm.get("expenseTime") as AbstractControl;
  }

  /** Merges the picked calendar date with the HH:mm time into one Date. */
  private mergeDateTime(): Date {
    const date: Date = this.expenseDateControl.value;
    const time: string = this.expenseTimeControl.value || "00:00";
    const [h, m] = time.split(":").map((n) => parseInt(n, 10));
    return moment(date)
      .hour(h || 0)
      .minute(m || 0)
      .second(0)
      .millisecond(0)
      .toDate();
  }

  async addExpenses(vm: ExpensesCreateFacadeModel): Promise<void> {
    if (this.expensesForm.invalid) {
      return;
    }
    await this.facade.addExpense(
      {
        userId: vm.userId,
        name: this.nameControl.value,
        amount: this.amountControl.value,
        expenseDate: Timestamp.fromDate(this.mergeDateTime()),
      },
      vm.addMode,
    );
    this.matDialogRef.close();
  }

  // Auto-fill the expense from the product Gemini identified in the photo.
  onItemDetected(item: GeminiScanResult): void {
    this.imageDetected = true;
    if (item.name) {
      this.nameControl.setValue(item.name);
    }
    if (item.price != null) {
      this.amountControl.setValue(item.price.toString());
    }
  }

  onScanError(error: string): void {
    // Handle product scan error
    this.imageDetected = false;
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}
