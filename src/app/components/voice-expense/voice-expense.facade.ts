import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { firstValueFrom } from "rxjs";
import { Timestamp } from "firebase/firestore";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { ExpensesService } from "@services";

@Injectable()
export class VoiceExpenseFacade {
  constructor(
    private store: Store<AppState>,
    private expensesService: ExpensesService,
    private snackbar: MatSnackBar
  ) {}

  /** Adds an expense captured by voice. Category is left empty so it can be
   *  auto-categorized later from Settings. */
  async addExpense(name: string, amount: number): Promise<void> {
    const user = await firstValueFrom(
      this.store.select(selectAuthenticatedUser)
    );

    await this.expensesService.addExpenses({
      userId: user?.id,
      name,
      amount,
      category: null,
      expenseDate: Timestamp.fromDate(new Date()),
    });

    this.snackbar.open(`Added “${name}”.`, "Close", {
      duration: 3000,
      panelClass: ["success-snackbar"],
    });
  }
}
