import { Injectable } from "@angular/core";
import { Expense } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";

@Injectable({
  providedIn: "root",
})
export class ExpensesService {
  constructor(private firestoreService: FirestoreService) {}

  getExpenses<T extends Expense[]>(): Observable<T> {
    return this.firestoreService.getDocument<T>("expenses");
  }

  addExpenses(data: Partial<Expense>): Promise<string> {
    const expenseId = this.firestoreService.addDocument("expenses", {
      ...data,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });

    return expenseId;
  }
}
