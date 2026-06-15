import { Timestamp } from "firebase/firestore";
import moment from "moment";

/**
 * How a bill recurs:
 * - `recurring`    — installments toward a total (set a term count).
 * - `subscription` — an ongoing recurring charge (set a term count too).
 * - `onetime`      — a single payment; the bill leaves the list once paid.
 *
 * `fixed` is the legacy value for what is now `subscription` and is still
 * accepted when reading old documents.
 */
export type BillingType = "recurring" | "subscription" | "onetime";

/**
 * A single historical payment of a bill, appended to `Billing.payments` each
 * time "Pay Bill" is executed. Drives the visual term tracker on the card.
 */
export interface BillingPayment {
  /** Unique id for this payment record. */
  id: string;
  /** When the payment was processed. */
  timestamp: Timestamp;
  /** Amount paid (mirrors the bill price at the time of payment). */
  amount: number;
  /** Id of the linked expense record created in the expenses collection. */
  expenseId?: string;
}

export interface Billing {
  id: string;
  userId: string;
  name: string;
  price: number;
  /** 'recurring' | 'subscription' | 'onetime'. Defaults to recurring. */
  type?: BillingType;
  /** When billing begins. */
  startDate?: Timestamp | null;
  /** Total billing iterations / installments. One-time bills are always 1. */
  terms?: number;
  /** Historical payment records (one per executed "Pay Bill"). */
  payments?: BillingPayment[];
  /** Legacy day-of-month field, retained for backward compatibility. */
  dueDay?: number;
  description?: string;
  paid?: boolean;
  created: Timestamp;
  updated: Timestamp;
}

/** True for a one-time (single payment) bill. */
export function isOneTimeBilling(billing: Pick<Billing, "type">): boolean {
  return billing.type === "onetime";
}

/**
 * True for an open-ended subscription (no fixed term count — pay forever).
 * Accepts the legacy `fixed` value, which is now a subscription.
 */
export function isSubscriptionBilling(
  billing: Pick<Billing, "type">
): boolean {
  return billing.type === "subscription" || (billing.type as string) === "fixed";
}

/** True if the bill has a payment dated within the given month (default: now). */
export function isBillingPaidThisMonth(
  billing: Pick<Billing, "payments">,
  now: Date = new Date()
): boolean {
  const year = now.getFullYear();
  const month = now.getMonth();
  return (billing.payments ?? []).some((p) => {
    const ms =
      p.timestamp && typeof p.timestamp.toMillis === "function"
        ? p.timestamp.toMillis()
        : 0;
    if (!ms) {
      return false;
    }
    const d = new Date(ms);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Number of tracker slots:
 * - one-time → 1
 * - recurring → the configured installment count (min 1)
 * - subscription → 1 (a single monthly slot that resets each month)
 */
export function getBillingTerms(
  billing: Pick<Billing, "type" | "terms" | "payments">
): number {
  if (isOneTimeBilling(billing) || isSubscriptionBilling(billing)) {
    return 1;
  }
  return Math.max(1, billing.terms ?? 1);
}

/**
 * Paid-term count for the tracker. Subscriptions reflect only the CURRENT month
 * (1 if paid this month, else 0); others count lifetime payments up to `terms`.
 */
export function getBillingPaidCount(
  billing: Pick<Billing, "type" | "terms" | "payments">
): number {
  if (isSubscriptionBilling(billing)) {
    return isBillingPaidThisMonth(billing) ? 1 : 0;
  }
  const paid = billing.payments?.length ?? 0;
  return Math.min(paid, getBillingTerms(billing));
}

/**
 * True once every term has been paid. Subscriptions are never "fully paid"
 * (they recur), but `isBillingPaidThisMonth` tells you the current cycle.
 */
export function isBillingFullyPaid(
  billing: Pick<Billing, "type" | "terms" | "payments">
): boolean {
  if (isSubscriptionBilling(billing)) {
    return false;
  }
  return getBillingPaidCount(billing) >= getBillingTerms(billing);
}

/**
 * The date the next expected payment is (or was) due:
 * - one-time → the start date.
 * - subscription → the dueDay (or start day) of the current month.
 * - recurring → start date + (lifetime payments) months (next installment).
 * Returns null when there's no start date to schedule from.
 */
export function getBillingDueDate(
  billing: Pick<Billing, "type" | "terms" | "payments" | "startDate" | "dueDay">,
  now: Date = new Date()
): Date | null {
  const startMs =
    billing.startDate && typeof billing.startDate.toMillis === "function"
      ? billing.startDate.toMillis()
      : null;

  if (isOneTimeBilling(billing)) {
    return startMs != null ? moment(startMs).startOf("day").toDate() : null;
  }

  if (isSubscriptionBilling(billing)) {
    const day =
      billing.dueDay && billing.dueDay > 0
        ? billing.dueDay
        : startMs != null
        ? moment(startMs).date()
        : null;
    if (day == null) {
      return null;
    }
    const ref = moment(now);
    return ref.date(Math.min(day, ref.daysInMonth())).startOf("day").toDate();
  }

  // recurring: the installment at index = lifetime payments made so far.
  if (startMs == null) {
    return null;
  }
  const made = billing.payments?.length ?? 0;
  return moment(startMs).add(made, "months").startOf("day").toDate();
}

/**
 * True when the bill's current obligation is past its due date and unpaid.
 * Fully-paid (or this-month-paid, for subscriptions) bills are never overdue,
 * and nothing is overdue before its start date.
 */
export function isBillingOverdue(
  billing: Pick<Billing, "type" | "terms" | "payments" | "startDate" | "dueDay">,
  now: Date = new Date()
): boolean {
  if (isSubscriptionBilling(billing)) {
    if (isBillingPaidThisMonth(billing, now)) {
      return false;
    }
  } else if (isBillingFullyPaid(billing)) {
    return false;
  }

  const due = getBillingDueDate(billing, now);
  if (!due) {
    return false;
  }
  const today = moment(now).startOf("day");

  // Don't flag a bill before it has even started.
  const startMs =
    billing.startDate && typeof billing.startDate.toMillis === "function"
      ? billing.startDate.toMillis()
      : null;
  if (startMs != null && today.isBefore(moment(startMs).startOf("day"))) {
    return false;
  }

  return today.isAfter(moment(due).startOf("day"));
}

/** Human label for a bill type (maps legacy `fixed` → Subscription). */
export function getBillingTypeLabel(type?: string): string {
  switch (type) {
    case "onetime":
      return "One-time";
    case "recurring":
      return "Recurring";
    default:
      return "Subscription"; // 'subscription' and legacy 'fixed'
  }
}

/** Material icon for a bill type. */
export function getBillingTypeIcon(type?: string): string {
  switch (type) {
    case "onetime":
      return "looks_one";
    case "recurring":
      return "autorenew";
    default:
      return "subscriptions";
  }
}
