import { Inject, Injectable, OnDestroy, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { Expense, User } from "@models";
import { Store } from "@ngrx/store";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  Subscription,
  switchMap,
} from "rxjs";
import { ExpensesService, GeminiService } from "@services";
import moment from "moment";

// Pebby's report is cached this long so it doesn't spend API usage on every
// dashboard visit. A manual refresh bypasses it.
const PEBBY_TTL_MS = 60 * 60 * 1000; // 1 hour
const PEBBY_CACHE_PREFIX = "peb.pebby.";

export interface MonthlyPoint {
  label: string;
  amount: number;
  height: number; // 0-100, relative bar height
}

export interface CategorySlice {
  name: string;
  amount: number;
  pct: number; // 0-100, share of total
}

export interface HomeFacadeModel {
  user?: User;
  totalSpent: number;
  thisMonth: number;
  transactionCount: number;
  averageAmount: number;
  monthly: MonthlyPoint[];
  topCategories: CategorySlice[];
  hasData: boolean;
}

export type PebbyStatus =
  | "loading"
  | "ready"
  | "empty"
  | "unavailable"
  | "error";

export interface PebbyReport {
  status: PebbyStatus;
  message: string;
}

const emptyAnalytics = {
  totalSpent: 0,
  thisMonth: 0,
  transactionCount: 0,
  averageAmount: 0,
  monthly: [] as MonthlyPoint[],
  topCategories: [] as CategorySlice[],
  hasData: false,
};

export const initialState: HomeFacadeModel = {
  user: {} as User,
  ...emptyAnalytics,
};

@Injectable()
export class HomeFacade implements OnDestroy {
  vm$: Observable<HomeFacadeModel> = of(initialState);

  private pebbySubject = new BehaviorSubject<PebbyReport>({
    status: "loading",
    message: "",
  });
  /** Pebby's AI spending report (cached up to an hour; refresh() forces a new one). */
  pebby$ = this.pebbySubject.asObservable();

  private autoSub?: Subscription;
  private readonly isBrowser: boolean;

  constructor(
    private store: Store<AppState>,
    private expensesService: ExpensesService,
    private gemini: GeminiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.vm$ = this.buildViewModel().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    // Evaluate Pebby when the metrics settle. Uses the cached report when it's
    // less than an hour old, so revisiting the dashboard doesn't spend API
    // usage on every load.
    this.autoSub = this.vm$
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            a.totalSpent === b.totalSpent &&
            a.thisMonth === b.thisMonth &&
            a.transactionCount === b.transactionCount
        ),
        debounceTime(500)
      )
      .subscribe((vm) => this.loadPebby(vm, false));
  }

  ngOnDestroy(): void {
    this.autoSub?.unsubscribe();
  }

  /** Manually re-run Pebby, bypassing the hourly cache. */
  refresh(): void {
    firstValueFrom(this.vm$).then((vm) => this.loadPebby(vm, true));
  }

  private buildViewModel(): Observable<HomeFacadeModel> {
    return this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user): Observable<HomeFacadeModel> => {
        if (!user?.id) {
          return of({ user, ...emptyAnalytics });
        }
        return this.expensesService.getExpensesByUserId(user.id).pipe(
          map((expenses) => this.computeModel(user, expenses))
        );
      })
    );
  }

  /**
   * Resolves Pebby's report for the given metrics. When not forced, a cached
   * report under an hour old is reused without hitting the API.
   */
  private async loadPebby(
    vm: HomeFacadeModel,
    forced: boolean
  ): Promise<void> {
    if (!this.gemini.isConfigured) {
      this.pebbySubject.next({
        status: "unavailable",
        message:
          "Add a Google Gemini API key to get spending insights from Pebby.",
      });
      return;
    }
    if (!vm.hasData) {
      this.pebbySubject.next({
        status: "empty",
        message:
          "Add a few expenses and I'll start sharing insights on your spending.",
      });
      return;
    }

    if (!forced) {
      const cached = this.readCache(vm.user?.id);
      if (cached) {
        this.pebbySubject.next({ status: "ready", message: cached });
        return;
      }
    }

    if (!this.isBrowser) {
      return; // never call the API during server-side rendering
    }

    this.pebbySubject.next({ status: "loading", message: "" });
    try {
      const message = await this.gemini.getSpendingReport(this.summarize(vm));
      this.writeCache(vm.user?.id, message);
      this.pebbySubject.next({ status: "ready", message });
    } catch {
      this.pebbySubject.next({
        status: "error",
        message: "Pebby couldn't analyze your spending right now.",
      });
    }
  }

  private cacheKey(userId?: string): string {
    return `${PEBBY_CACHE_PREFIX}${userId || "anon"}`;
  }

  /** Returns the cached message if present and less than an hour old. */
  private readCache(userId?: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      const raw = localStorage.getItem(this.cacheKey(userId));
      if (!raw) {
        return null;
      }
      const { message, timestamp } = JSON.parse(raw);
      if (typeof message !== "string" || typeof timestamp !== "number") {
        return null;
      }
      return Date.now() - timestamp < PEBBY_TTL_MS ? message : null;
    } catch {
      return null;
    }
  }

  private writeCache(userId: string | undefined, message: string): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(
        this.cacheKey(userId),
        JSON.stringify({ message, timestamp: Date.now() })
      );
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }

  private summarize(vm: HomeFacadeModel): string {
    return [
      `Total spent (all time): ${vm.totalSpent}`,
      `Spent this month: ${vm.thisMonth}`,
      `Number of transactions: ${vm.transactionCount}`,
      `Average per expense: ${Math.round(vm.averageAmount)}`,
      `Last 6 months: ${vm.monthly
        .map((m) => `${m.label}=${m.amount}`)
        .join(", ")}`,
      `Top categories: ${vm.topCategories
        .map((c) => `${c.name}=${c.amount} (${c.pct}%)`)
        .join(", ")}`,
    ].join("\n");
  }

  private computeModel(user: User, expenses: Expense[]): HomeFacadeModel {
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const transactionCount = expenses.length;
    const averageAmount = transactionCount > 0 ? totalSpent / transactionCount : 0;

    const startOfMonth = moment().startOf("month");
    const thisMonth = expenses
      .filter((e) => moment(this.dateOf(e)).isSameOrAfter(startOfMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      user,
      totalSpent,
      thisMonth,
      transactionCount,
      averageAmount,
      monthly: this.buildMonthly(expenses),
      topCategories: this.buildCategories(expenses, totalSpent),
      hasData: transactionCount > 0,
    };
  }

  /** Sum of spending for each of the last 6 months, normalised to bar heights. */
  private buildMonthly(expenses: Expense[]): MonthlyPoint[] {
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const m = moment().subtract(5 - i, "months");
      return { key: m.format("YYYY-MM"), label: m.format("MMM"), amount: 0 };
    });

    for (const e of expenses) {
      const key = moment(this.dateOf(e)).format("YYYY-MM");
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) {
        bucket.amount += e.amount || 0;
      }
    }

    const max = Math.max(...buckets.map((b) => b.amount), 1);
    return buckets.map((b) => ({
      label: b.label,
      amount: b.amount,
      height: Math.round((b.amount / max) * 100),
    }));
  }

  /** Top 5 spending categories as a share of total. */
  private buildCategories(expenses: Expense[], total: number): CategorySlice[] {
    const totals: { [name: string]: number } = {};
    for (const e of expenses) {
      const name = (e.category || "other").toLowerCase();
      totals[name] = (totals[name] || 0) + (e.amount || 0);
    }

    const safeTotal = total || 1;
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: Math.round((amount / safeTotal) * 100),
      }));
  }

  private dateOf(e: Expense): Date {
    if (e.expenseDate) {
      return e.expenseDate.toDate();
    }
    if (e.created) {
      return e.created.toDate();
    }
    return new Date();
  }
}
