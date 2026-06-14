import { Injectable } from "@angular/core";
import { Billing } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { makeId, removeNoValuesKeys } from "@app/shared/utils";
import { query, where } from '@angular/fire/firestore';
import {
  BillingPayment,
  ExpenseCategory,
  getBillingTerms,
} from "@app/models";
import { Timestamp } from "firebase/firestore";
import { ExpensesService } from "./expenses.service";

/** Result of executing one bill payment. */
export interface PayTermResult {
  /** No write happened because the bill was already fully paid. */
  alreadyPaid: boolean;
  /** True once this payment settled the final term. */
  fullyPaid: boolean;
  /** Terms still outstanding after this payment. */
  remaining: number;
}

@Injectable({
  providedIn: "root",
})
export class BillingService {
  constructor(
    private firestoreService: FirestoreService,
    private expensesService: ExpensesService
  ) {}

  getBills(): Observable<Billing[]> {
    return this.firestoreService.getDocument(
      DBPathHelper.getBillsPath()
    ) as Observable<Billing[]>;
  }

  getBillsByQuery(queryFn: (q: any) => any): Observable<Billing[]> {
    return this.firestoreService.getDocumentByQuery(
      DBPathHelper.getBillsPath(),
      queryFn
    ) as Observable<Billing[]>;
  }

  getBillsByUserId(userId: string): Observable<Billing[]> {
    return this.getBillsByQuery((collectionRef) =>
      query(collectionRef, where('userId', '==', userId))
    ) as Observable<Billing[]>;
  }

  getBillById(id: string): Observable<Billing | undefined> {
    return this.firestoreService.getDocumentById(
      DBPathHelper.getBillsPath(),
      id
    ) as Observable<Billing | undefined>;
  }

  async addBill(data: Partial<Billing>): Promise<void> {
    await this.firestoreService.addDocument(DBPathHelper.getBillsPath(), {
      ...data,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });
  }

  async updateBill(data: Partial<Billing>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.updateDocument(
      DBPathHelper.getBillsPath(),
      data.id as string,
      removeNoValuesKeys({
        ...data,
        updated: this.firestoreService.timestamp,
      })
    );
  }

  /**
   * Executes one term payment: records a Billings-category expense dated now
   * and appends a payment to the bill. Shared by the card and the detail modal
   * so the pay logic lives in one place.
   */
  async payTerm(bill: Billing): Promise<PayTermResult> {
    const terms = getBillingTerms(bill);
    const paidCount = bill.payments?.length ?? 0;

    if (paidCount >= terms) {
      return { alreadyPaid: true, fullyPaid: true, remaining: 0 };
    }

    const now = Timestamp.now();
    const payment: BillingPayment = {
      id: makeId(20),
      timestamp: now,
      amount: bill.price ?? 0,
    };

    await this.expensesService.addExpenses({
      userId: bill.userId,
      billingId: bill.id,
      name: bill.name,
      amount: bill.price,
      category: ExpenseCategory.BILLS,
      expenseDate: now,
    });

    const payments = [...(bill.payments ?? []), payment];
    await this.updatePayments(bill.id, payments);

    const remaining = Math.max(0, terms - payments.length);
    return { alreadyPaid: false, fullyPaid: remaining === 0, remaining };
  }

  /**
   * Appends/replaces the bill's payment history without clobbering `created`.
   * Payment entries carry client `Timestamp`s (serverTimestamp can't live
   * inside an array), so we write the whole array each time.
   */
  async updatePayments(id: string, payments: BillingPayment[]): Promise<void> {
    if (!id) {
      return;
    }
    await this.firestoreService.updateDocument(DBPathHelper.getBillsPath(), id, {
      payments,
      updated: this.firestoreService.timestamp,
    });
  }

  async deleteBill(data: Partial<Billing>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.deleteDocument(
      DBPathHelper.getBillsPath(),
      data.id
    );
  }
}
