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

  onStartDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.facade.updateStartDate(target.value);
  }

  onEndDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.facade.updateEndDate(target.value);
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
