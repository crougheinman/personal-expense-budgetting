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
import { ExpensesEditFacade } from "./expenses-edit.facade";
import {
  EXPENSE_CATEGORIES,
  getExpenseCategoryIcon,
  getCategoryDisplayName,
} from "@app/models";
import { Timestamp } from "firebase/firestore";
import moment from "moment";

interface InputData {
  id?: string;
  name?: string;
  amount?: string;
  description?: string;
  category?: string;
  expenseDate?: Timestamp;
}

@Component({
  selector: "component-expenses-edit",
  standalone: false,
  templateUrl: "./expenses-edit.component.html",
  styleUrl: "./expenses-edit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesEditFacade],
})
export class ExpensesEditComponent {
  expensesForm!: FormGroup;
  categories = EXPENSE_CATEGORIES;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: InputData,
    private facade: ExpensesEditFacade,
    private formBuilder: FormBuilder,
    private matBottomSheetRef: MatBottomSheetRef<ExpensesEditComponent>,
  ) {
    const { name, amount, description, category, expenseDate } = data;
    const date = expenseDate?.toDate() ?? new Date();
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null, Validators.required),
      expenseAmount: new FormControl<string | null>(null, Validators.required),
      expenseDescription: new FormControl<string | null>(null),
      expenseCategory: new FormControl<string | null>(null, Validators.required),
      expenseDate: new FormControl<Date | null>(null, Validators.required),
      expenseTime: new FormControl<string | null>(null, Validators.required),
    });
    this.nameControl.setValue(name);
    this.amountControl.setValue(amount);
    this.descriptionControl.setValue(description);
    this.categoryControl.setValue(category);
    this.expenseDateControl.setValue(date);
    this.expenseTimeControl.setValue(moment(date).format("HH:mm"));
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.expensesForm.get("expenseDescription") as AbstractControl;
  }

  get categoryControl(): AbstractControl {
    return this.expensesForm.get("expenseCategory") as AbstractControl;
  }

  get expenseDateControl(): AbstractControl {
    return this.expensesForm.get("expenseDate") as AbstractControl;
  }

  get expenseTimeControl(): AbstractControl {
    return this.expensesForm.get("expenseTime") as AbstractControl;
  }

  selectCategory(category: string): void {
    this.categoryControl.setValue(category);
  }

  categoryIcon(category: string): string {
    return getExpenseCategoryIcon(category);
  }

  categoryLabel(category: string): string {
    return getCategoryDisplayName(category);
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

  async updateExpense(): Promise<void> {
    if (this.expensesForm.invalid) {
      return;
    }
    await this.facade.editExpense({
      id: this.data.id,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      description: this.descriptionControl.value,
      category: this.categoryControl.value,
      expenseDate: Timestamp.fromDate(this.mergeDateTime()),
    });

    this.matBottomSheetRef.dismiss();
  }

  close(): void {
    this.matBottomSheetRef.dismiss();
  }
}
