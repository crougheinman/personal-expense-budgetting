import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { firstValueFrom, Observable, of, switchMap } from "rxjs";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { ExpensesService, GeminiService, IncomeService } from "@services";
import { IncomeInput } from "@app/services/income.service";
import { EXPENSE_CATEGORIES, ExpenseCategory, Income } from "@models";

export interface CategorizeResult {
  /** Number of uncategorized expenses found. */
  total: number;
  /** Number of expenses that received a real category. */
  updated: number;
}

@Injectable()
export class SettingsFacade {
  constructor(
    private store: Store<AppState>,
    private expensesService: ExpensesService,
    private incomeService: IncomeService,
    private gemini: GeminiService
  ) {}

  /** Whether AI features are available (a Gemini key is configured). */
  get geminiConfigured(): boolean {
    return this.gemini.isConfigured;
  }

  /** The user's saved income sources (live). */
  getIncomes(): Observable<Income[]> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) =>
        user?.id ? this.incomeService.getIncomesByUserId(user.id) : of([])
      )
    );
  }

  /** Adds a new income source. */
  async addIncome(input: IncomeInput): Promise<void> {
    const user = await firstValueFrom(
      this.store.select(selectAuthenticatedUser)
    );
    if (!user?.id) {
      throw new Error("No authenticated user");
    }
    await this.incomeService.addIncome(user.id, input);
  }

  /** Updates an existing income source. */
  updateIncome(id: string, input: IncomeInput): Promise<void> {
    return this.incomeService.updateIncome(id, input);
  }

  /** Removes an income source. */
  deleteIncome(id: string): Promise<void> {
    return this.incomeService.deleteIncome(id);
  }

  /**
   * Finds the current user's expenses that have no category and asks Gemini to
   * assign one based on the expense name, then writes the results back.
   */
  async autoCategorizeExpenses(): Promise<CategorizeResult> {
    const user = await firstValueFrom(
      this.store.select(selectAuthenticatedUser)
    );
    if (!user?.id) {
      return { total: 0, updated: 0 };
    }

    const expenses = await firstValueFrom(
      this.expensesService.getExpensesByUserId(user.id)
    );

    const uncategorized = expenses.filter((e) =>
      this.isUncategorized(e.category)
    );
    if (uncategorized.length === 0) {
      return { total: 0, updated: 0 };
    }

    const items = uncategorized
      .filter((e) => !!e.id)
      .map((e) => ({ id: e.id as string, name: e.name }));

    const results = await this.gemini.categorizeExpenses(
      items,
      EXPENSE_CATEGORIES
    );

    const valid = new Set(EXPENSE_CATEGORIES.map((c) => c.toLowerCase()));
    let updated = 0;

    for (const r of results) {
      const category = (r?.category || "").trim().toLowerCase();
      // Only write a meaningful, recognised category (skip "default").
      if (
        !r?.id ||
        !valid.has(category) ||
        category === ExpenseCategory.DEFAULT
      ) {
        continue;
      }
      await this.expensesService.updateExpense({ id: r.id, category });
      updated++;
    }

    return { total: uncategorized.length, updated };
  }

  private isUncategorized(category: string | null | undefined): boolean {
    const c = (category || "").trim().toLowerCase();
    return c === "" || c === ExpenseCategory.DEFAULT;
  }
}
