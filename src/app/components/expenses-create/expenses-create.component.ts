import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { ExpensesCreateFacade } from "./expenses-create.facade";
import { MatDialogRef } from "@angular/material/dialog";

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

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
  ) {
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

  async addExpenses(): Promise<void> {
    await this.facade.addExpense({
      name: this.nameControl.value,
      amount: this.amountControl.value,
    });
    
    this.matDialogRef.close();
  }
}
