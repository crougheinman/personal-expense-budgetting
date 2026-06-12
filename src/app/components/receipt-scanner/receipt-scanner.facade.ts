import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { firstValueFrom } from "rxjs";
import { Timestamp } from "firebase/firestore";
import moment from "moment";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { ExpensesService, GeminiService, ReceiptScanResult } from "@services";
import { EXPENSE_CATEGORIES } from "@models";

export interface ReceiptDraftItem {
  description: string;
  amount: number;
  category: string;
  date: string | null; // YYYY-MM-DD
}

@Injectable()
export class ReceiptScannerFacade {
  constructor(
    private store: Store<AppState>,
    private expensesService: ExpensesService,
    private gemini: GeminiService,
    private snackbar: MatSnackBar
  ) {}

  get geminiConfigured(): boolean {
    return this.gemini.isConfigured;
  }

  /** Parses a receipt file (already base64-encoded) into line items. */
  scan(base64: string, mimeType: string): Promise<ReceiptScanResult> {
    return this.gemini.scanReceipt(base64, mimeType, EXPENSE_CATEGORIES);
  }

  /** Saves the chosen line items as individual expenses. Returns the count saved. */
  async bulkAdd(items: ReceiptDraftItem[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }
    const user = await firstValueFrom(
      this.store.select(selectAuthenticatedUser)
    );
    if (!user?.id) {
      return 0;
    }

    await Promise.all(
      items.map((item) =>
        this.expensesService.addExpenses({
          userId: user.id,
          name: item.description,
          amount: Number(item.amount) || 0,
          category: item.category || null,
          expenseDate: this.toTimestamp(item.date),
        })
      )
    );

    this.snackbar.open(
      `Added ${items.length} expense${items.length === 1 ? "" : "s"} from the receipt.`,
      "Close",
      { duration: 3000, panelClass: ["success-snackbar"] }
    );

    return items.length;
  }

  private toTimestamp(date: string | null): Timestamp {
    const m = date ? moment(date, "YYYY-MM-DD", true) : null;
    return Timestamp.fromDate(m && m.isValid() ? m.toDate() : new Date());
  }
}
