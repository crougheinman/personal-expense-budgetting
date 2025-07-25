import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  ExpensesListFacade,
  ExpensesListFacadeModel,
  initialState,
} from "./expenses-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { 
  Expense, 
  EXPENSE_CATEGORIES, 
  EXPENSE_CATEGORY_ICONS, 
  getExpenseCategoryIcon, 
  getCategoryDisplayName 
} from "@app/models";
import { ExpensesEditComponent } from "../expenses-edit/expenses-edit.component";
import moment from "moment";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { DateRange } from "@angular/material/datepicker";
import { AbstractControl, FormBuilder, FormControl, FormGroup } from "@angular/forms";

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
  categories = ['all', ...EXPENSE_CATEGORIES];
  selectedCategory = 'all';
  showCategoryFilter = false;
  startDate = moment().startOf('month').toISOString();
  endDate = moment().endOf('month').toISOString();
  expensesFilterForm!: FormGroup;

  constructor(
    private facade: ExpensesListFacade,
    private bottomSheet: MatBottomSheet,
    private formBuilder: FormBuilder,
  ) {
    this.vm$ = this.facade.vm$;
    this.expensesFilterForm = this.formBuilder.group({
      startDate: new FormControl<Date | null>(null),
      endDate: new FormControl<Date | null>(null),
    })
    this.startDateControl.setValue(this.startDate);
    this.endDateControl.setValue(this.endDate);
  }

  get startDateControl(): AbstractControl {
    return this.expensesFilterForm.get("startDate") as AbstractControl;
  }

  get endDateControl(): AbstractControl {
    return this.expensesFilterForm.get("endDate") as AbstractControl;
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  onStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.startDate = event.value.toISOString();
      this.facade.updateStartDate(this.startDate);
    }
  }

  onEndDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.endDate = event.value.toISOString();
      this.facade.updateEndDate(this.endDate);
    }
  }

  onCategoryFilter(category: string): void {
    this.selectedCategory = category;
    this.facade.updateSelectedCategory(category);
  }

  toggleCategoryFilter(): void {
    this.showCategoryFilter = !this.showCategoryFilter;
  }

  onClick(expense: Expense): void {
    this.bottomSheet.open(ExpensesEditComponent, {
      data: {
        ...expense,
      },
    });
  }

  getCategoryIcon(category: string): string {
    return EXPENSE_CATEGORY_ICONS[category?.toLowerCase()] || EXPENSE_CATEGORY_ICONS['all'];
  }

  getCategoryDisplayName(category: string): string {
    return getCategoryDisplayName(category);
  }

  getExpenseIcon(category: string): string {
    return getExpenseCategoryIcon(category);
  }

  getAmountClass(amount: number): string {
    if (amount < 0) {
      return 'negative';
    } else if (amount > 0) {
      return 'positive';
    }
    return '';
  }
}
