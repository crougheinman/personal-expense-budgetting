import { Injectable } from "@angular/core";
import { Expense } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { removeNoValuesKeys } from "@app/shared/utils";

@Injectable({
  providedIn: "root",
})
export class ExpensesService {
  constructor(private firestoreService: FirestoreService) {}

  getExpenses(): Observable<Expense[]> {
    return this.firestoreService.getDocument(
      DBPathHelper.getExpensesPath()
    ) as Observable<Expense[]>;
  }

  async addExpenses(data: Partial<Expense>): Promise<void> {
    await this.firestoreService.addDocument(DBPathHelper.getExpensesPath(), {
      ...data,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });
  }

  async updateExpense(data: Partial<Expense>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.updateDocument(
      DBPathHelper.getExpensesPath(),
      data.id as string,
      removeNoValuesKeys({
        ...data,
        created: this.firestoreService.timestamp,
        updated: this.firestoreService.timestamp,
      })
    );
  }

  async deleteExpense(data: Partial<Expense>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.deleteDocument(
      DBPathHelper.getExpensesPath(),
      data.id
    );
  }
}
