import { Timestamp } from "firebase/firestore";

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

/** Number of payments made (subscriptions are unbounded; others clamp to terms). */
export function getBillingPaidCount(
  billing: Pick<Billing, "type" | "terms" | "payments">
): number {
  const paid = billing.payments?.length ?? 0;
  if (isSubscriptionBilling(billing)) {
    return paid;
  }
  return Math.min(paid, getBillingTerms(billing));
}

/**
 * Number of tracker slots:
 * - one-time → 1
 * - recurring → the configured installment count (min 1)
 * - subscription → the count of payments so far (it has no fixed total)
 */
export function getBillingTerms(
  billing: Pick<Billing, "type" | "terms" | "payments">
): number {
  if (isOneTimeBilling(billing)) {
    return 1;
  }
  if (isSubscriptionBilling(billing)) {
    return getBillingPaidCount(billing);
  }
  return Math.max(1, billing.terms ?? 1);
}

/** True once every term has been paid. Subscriptions are never "fully paid". */
export function isBillingFullyPaid(
  billing: Pick<Billing, "type" | "terms" | "payments">
): boolean {
  if (isSubscriptionBilling(billing)) {
    return false;
  }
  return getBillingPaidCount(billing) >= getBillingTerms(billing);
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
