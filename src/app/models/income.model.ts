import { Timestamp } from "firebase/firestore";

/** How often the salary is received. */
export type IncomeFrequency = "monthly" | "bimonthly";

/**
 * A single income source (the user can have several — e.g. a main job plus a
 * side gig). `amount` is per pay period; bi-monthly means paid twice a month
 * (semi-monthly), so its monthly total is `amount × 2`.
 */
export interface Income {
  id?: string;
  userId: string;
  /** Optional label, e.g. "Main job", "Freelance". */
  name?: string;
  amount: number;
  frequency: IncomeFrequency;
  created?: Timestamp;
  updated?: Timestamp;
}

/** Monthly equivalent of one income source. */
export function getMonthlyIncome(income?: Partial<Income> | null): number {
  if (!income || !income.amount) {
    return 0;
  }
  return income.frequency === "bimonthly" ? income.amount * 2 : income.amount;
}

/** Combined monthly income across every income source. */
export function getTotalMonthlyIncome(incomes?: Income[] | null): number {
  return (incomes ?? []).reduce((sum, i) => sum + getMonthlyIncome(i), 0);
}

/** Human label for an income frequency. */
export function getIncomeFrequencyLabel(frequency?: IncomeFrequency): string {
  return frequency === "bimonthly" ? "Twice a month" : "Monthly";
}
