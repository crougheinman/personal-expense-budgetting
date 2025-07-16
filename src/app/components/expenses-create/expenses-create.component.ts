import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { ExpensesCreateFacade, ExpensesCreateFacadeModel, initialState } from "./expenses-create.facade";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, of } from "rxjs";

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

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
  ) {
    this.vm$ = this.facade.vm$;
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
      category: 'default',
      expenseDate: new Date(),
    });
    
    this.matDialogRef.close();
  }
}
