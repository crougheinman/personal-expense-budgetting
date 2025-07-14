import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { AbstractControl, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { ExpensesEditFacade } from "./expenses-edit.facade";
import { Expense, EXPENSE_CATEGORIES } from "@app/models";

interface InputData {
  id?: string;
  name?: string;
  amount?: string;
  description?: string;
  category?: string;
  expenseDate?: Date;
}

@Component({
  selector: "component-expenses-edit",
  standalone: false,
  templateUrl: "./expenses-edit.component.html",
  styleUrl: "./expenses-edit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesEditFacade]
})
export class ExpensesEditComponent {
  expensesForm!: FormGroup;
  categories = EXPENSE_CATEGORIES;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: InputData,
    private facade: ExpensesEditFacade,
    private formBuilder: FormBuilder,
    private matBottomSheetRef: MatBottomSheetRef<ExpensesEditComponent>
  ) {
    const { name, amount, description, category, expenseDate } = data
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null),
      expenseAmount: new FormControl<string | null>(null),
      expenseDescription: new FormControl<string | null>(null),
      expenseCategory: new FormControl<string | null>(null),
      expenseDate: new FormControl<Date | null>(null),
    });
    this.nameControl.setValue(name);
    this.amountControl.setValue(amount);
    this.descriptionControl.setValue(description);
    this.categoryControl.setValue(category);
    this.expenseDateControl.setValue(expenseDate)
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
    return this.expensesForm.get('expenseDate') as AbstractControl;
  }

  async updateExpense(): Promise<void> {
    this.facade.editExpense({
      id: this.data.id,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      description: this.descriptionControl.value,
      category: this.categoryControl.value,
      expenseDate: this.expenseDateControl.value,
    })

    this.matBottomSheetRef.dismiss();
  }

  async deleteExpense(): Promise<void> {
    this.facade.deleteExpense(this.data as Partial<Expense>);

    this.matBottomSheetRef.dismiss();
  }
}
