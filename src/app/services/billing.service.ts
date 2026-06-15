import { Injectable } from "@angular/core";
import { Billing } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { makeId, removeNoValuesKeys } from "@app/shared/utils";
import { query, where } from '@angular/fire/firestore';
import {
  BillingPayment,
  Expense,
  ExpenseCategory,
  getBillingTerms,
  isBillingPaidThisMonth,
  isSubscriptionBilling,
} from "@app/models";
import { Timestamp } from "firebase/firestore";
import { firstValueFrom } from "rxjs";
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
  async payTerm(bill: Billing, amountOverride?: number): Promise<PayTermResult> {
    const subscription = isSubscriptionBilling(bill);

    // Subscriptions are payable once per calendar month; finite bills until
    // every term is settled.
    if (subscription) {
      if (isBillingPaidThisMonth(bill)) {
        return { alreadyPaid: true, fullyPaid: false, remaining: 0 };
      }
    } else {
      const terms = getBillingTerms(bill);
      if ((bill.payments?.length ?? 0) >= terms) {
        return { alreadyPaid: true, fullyPaid: true, remaining: 0 };
      }
    }

    // Subscriptions can cost a different amount each month, so the caller may
    // pass the confirmed amount; otherwise fall back to the bill's set price.
    const amount = amountOverride != null ? amountOverride : bill.price ?? 0;
    const now = Timestamp.now();
    const payment: BillingPayment = {
      id: makeId(20),
      timestamp: now,
      amount,
    };

    await this.expensesService.addExpenses({
      userId: bill.userId,
      billingId: bill.id,
      billingPaymentId: payment.id,
      name: bill.name,
      amount,
      category: ExpenseCategory.BILLS,
      expenseDate: now,
    });

    const payments = [...(bill.payments ?? []), payment];
    await this.updatePayments(bill.id, payments);

    if (subscription) {
      return { alreadyPaid: false, fullyPaid: false, remaining: 0 };
    }
    const remaining = Math.max(0, getBillingTerms(bill) - payments.length);
    return { alreadyPaid: false, fullyPaid: remaining === 0, remaining };
  }

  /**
   * Reverse of a payment: when a bill-linked expense is deleted, drop the
   * matching entry from the bill's `payments` array (un-fills its term circle /
   * un-marks the subscription's month). No-op for non-bill expenses or bills
   * that no longer exist (e.g. a paid one-time bill that was already removed).
   */
  async removePaymentForExpense(expense: Partial<Expense>): Promise<void> {
    const billingId = expense.billingId;
    const userId = expense.userId;
    if (!billingId || !userId) {
      return;
    }

    let bill: Billing | undefined;
    try {
      const bills = await firstValueFrom(this.getBillsByUserId(userId));
      bill = bills.find((b) => b.id === billingId);
    } catch (error) {
      console.error("Failed to load bill for payment cleanup:", error);
      return;
    }
    if (!bill || !bill.payments?.length) {
      return;
    }

    const paymentId = expense.billingPaymentId;
    const expMs =
      expense.expenseDate && typeof expense.expenseDate.toMillis === "function"
        ? expense.expenseDate.toMillis()
        : null;

    // Remove exactly one matching payment — by linked id when present, else by
    // timestamp + amount (covers payments made before the id link existed).
    let removed = false;
    const remaining = bill.payments.filter((p) => {
      if (removed) {
        return true;
      }
      const matches = paymentId
        ? p.id === paymentId
        : expMs != null &&
          p.timestamp &&
          typeof p.timestamp.toMillis === "function" &&
          p.timestamp.toMillis() === expMs &&
          (expense.amount == null || p.amount === expense.amount);
      if (matches) {
        removed = true;
        return false;
      }
      return true;
    });

    if (removed) {
      await this.updatePayments(billingId, remaining);
    }
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
