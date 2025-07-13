import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  ExpensesListFacade,
  ExpensesListFacadeModel,
  initialState,
} from "./expenses-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { Expense } from "@app/models";
import { ExpensesEditComponent } from "../expenses-edit/expenses-edit.component";

@Component({
  selector: "component-expenses-list",
  templateUrl: "./expenses-list.component.html",
  styleUrl: "./expenses-list.component.scss",
  providers: [ExpensesListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesListComponent {
  vm$: Observable<ExpensesListFacadeModel> = of(initialState);

  constructor(
    private facade: ExpensesListFacade,
    private bottomSheet: MatBottomSheet
  ) {
    this.vm$ = this.facade.vm$;
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  onClick(expense: Expense): void {
    this.bottomSheet.open(ExpensesEditComponent, {
      data: {
        ...expense,
      },
    });
  }
}
