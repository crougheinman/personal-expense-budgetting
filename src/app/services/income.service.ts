import { Injectable } from "@angular/core";
import { Income, IncomeFrequency } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { query, where } from "@angular/fire/firestore";
import { removeNoValuesKeys } from "@app/shared/utils";

export interface IncomeInput {
  name?: string;
  amount: number;
  frequency: IncomeFrequency;
}

@Injectable({
  providedIn: "root",
})
export class IncomeService {
  constructor(private firestoreService: FirestoreService) {}

  /** All of the user's income sources (live). */
  getIncomesByUserId(userId: string): Observable<Income[]> {
    return this.firestoreService.getDocumentByQuery<Income>(
      DBPathHelper.getIncomePath(),
      (collectionRef) => query(collectionRef, where("userId", "==", userId))
    ) as Observable<Income[]>;
  }

  /** Adds a new income source for the user. */
  async addIncome(userId: string, data: IncomeInput): Promise<void> {
    await this.firestoreService.addDocument(DBPathHelper.getIncomePath(), {
      userId,
      name: data.name ?? "",
      amount: data.amount,
      frequency: data.frequency,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });
  }

  /** Updates an existing income source. */
  async updateIncome(id: string, data: IncomeInput): Promise<void> {
    if (!id) {
      return;
    }
    await this.firestoreService.updateDocument(
      DBPathHelper.getIncomePath(),
      id,
      removeNoValuesKeys({
        name: data.name ?? "",
        amount: data.amount,
        frequency: data.frequency,
        updated: this.firestoreService.timestamp,
      })
    );
  }

  /** Removes an income source. */
  async deleteIncome(id: string): Promise<void> {
    if (!id) {
      return;
    }
    await this.firestoreService.deleteDocument(
      DBPathHelper.getIncomePath(),
      id
    );
  }
}
