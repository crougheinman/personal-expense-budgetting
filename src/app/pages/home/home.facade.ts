import { Inject, Injectable, OnDestroy, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { AppState, selectAuthenticatedUser } from "@app/store";
import { Expense, User } from "@models";
import { Store } from "@ngrx/store";
import {
  BehaviorSubject,
  combineLatest,
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

export type StatGranularity = "daily" | "weekly" | "monthly";

export interface StatPoint {
  label: string;
  amount: number;
}

export interface StatsView {
  granularity: StatGranularity;
  points: StatPoint[];
  total: number;
  peakIndex: number; // index of the highest point (highlighted on the chart)
  breakdown: CategorySlice[];
}

export interface HomeFacadeModel {
  user?: User;
  // Scope is capped at the current year; metrics below the year total are for
  // the selected month (navigable with prev/next, within the current year).
  thisYear: number;
  monthSpent: number;
  monthCount: number;
  monthAverage: number;
  monthLabel: string;
  isCurrentMonth: boolean;
  canPrevMonth: boolean;
  canNextMonth: boolean;
  monthly: MonthlyPoint[];
  topCategories: CategorySlice[];
  stats: StatsView;
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
  thisYear: 0,
  monthSpent: 0,
  monthCount: 0,
  monthAverage: 0,
  monthLabel: moment().format("MMMM YYYY"),
  isCurrentMonth: true,
  canPrevMonth: moment().month() > 0,
  canNextMonth: false,
  monthly: [] as MonthlyPoint[],
  topCategories: [] as CategorySlice[],
  stats: {
    granularity: "daily" as StatGranularity,
    points: [] as StatPoint[],
    total: 0,
    peakIndex: 0,
    breakdown: [] as CategorySlice[],
  },
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

  // Selected month relative to now: 0 = this month, -1 = last month. Never
  // positive (no future), never before January of the current year.
  private monthOffset$ = new BehaviorSubject<number>(0);

  // Statistics-card granularity (Daily / Weekly / Monthly).
  private granularity$ = new BehaviorSubject<StatGranularity>("daily");

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
            a.thisYear === b.thisYear &&
            a.monthSpent === b.monthSpent &&
            a.monthCount === b.monthCount
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

  /** Step to the previous month (not before January of the current year). */
  previousMonth(): void {
    const min = -moment().month(); // months back to January
    this.monthOffset$.next(Math.max(min, this.monthOffset$.value - 1));
  }

  /** Step to the next month (never into the future). */
  nextMonth(): void {
    this.monthOffset$.next(Math.min(0, this.monthOffset$.value + 1));
  }

  /** Switch the Statistics card between Daily / Weekly / Monthly. */
  setGranularity(g: StatGranularity): void {
    this.granularity$.next(g);
  }

  private buildViewModel(): Observable<HomeFacadeModel> {
    const userExpenses$ = this.store.select(selectAuthenticatedUser).pipe(
      switchMap((user) =>
        user?.id
          ? this.expensesService
              .getExpensesByUserId(user.id)
              .pipe(map((expenses) => ({ user, expenses })))
          : of({ user, expenses: [] as Expense[] })
      )
    );

    // Re-derive metrics when month or granularity changes WITHOUT re-querying.
    return combineLatest([
      userExpenses$,
      this.monthOffset$,
      this.granularity$.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([{ user, expenses }, offset, granularity]) =>
        user?.id
          ? this.computeModel(user, expenses, offset, granularity)
          : { user, ...emptyAnalytics }
      )
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
      `Spent this year: ${vm.thisYear}`,
      `Selected month (${vm.monthLabel}) spent: ${vm.monthSpent}`,
      `Transactions that month: ${vm.monthCount}`,
      `Average per expense that month: ${Math.round(vm.monthAverage)}`,
      `Last 6 months: ${vm.monthly
        .map((m) => `${m.label}=${m.amount}`)
        .join(", ")}`,
      `Top categories that month: ${vm.topCategories
        .map((c) => `${c.name}=${c.amount} (${c.pct}%)`)
        .join(", ")}`,
    ].join("\n");
  }

  private computeModel(
    user: User,
    expenses: Expense[],
    monthOffset: number,
    granularity: StatGranularity
  ): HomeFacadeModel {
    const now = moment();

    // Year scope (cap): only the current calendar year counts.
    const yearStart = now.clone().startOf("year");
    const thisYear = expenses
      .filter((e) => moment(this.dateOf(e)).isSameOrAfter(yearStart))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Selected month, clamped within the current year and never in the future.
    const minOffset = -now.month(); // back to January
    const offset = Math.min(0, Math.max(monthOffset, minOffset));
    const selected = now.clone().add(offset, "months");
    const mStart = selected.clone().startOf("month");
    const mEnd = selected.clone().endOf("month");

    const monthExpenses = expenses.filter((e) => {
      const d = moment(this.dateOf(e));
      return d.isSameOrAfter(mStart) && d.isSameOrBefore(mEnd);
    });
    const monthSpent = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const monthCount = monthExpenses.length;

    return {
      user,
      thisYear,
      monthSpent,
      monthCount,
      monthAverage: monthCount > 0 ? monthSpent / monthCount : 0,
      monthLabel: selected.format("MMMM YYYY"),
      isCurrentMonth: offset === 0,
      canPrevMonth: offset > minOffset,
      canNextMonth: offset < 0,
      monthly: this.buildMonthly(expenses),
      topCategories: this.buildCategories(monthExpenses, monthSpent),
      stats: this.buildStats(expenses, granularity),
      hasData: expenses.length > 0,
    };
  }

  /**
   * Builds the Statistics-card series for the chosen granularity: 7 days, 6
   * weeks, or 6 months ending now. Returns the per-bucket totals, the grand
   * total, the peak bucket index, and a category breakdown over the same range.
   */
  private buildStats(
    expenses: Expense[],
    granularity: StatGranularity
  ): StatsView {
    const now = moment();
    const buckets: {
      start: moment.Moment;
      end: moment.Moment;
      label: string;
      amount: number;
    }[] = [];

    if (granularity === "daily") {
      for (let i = 6; i >= 0; i--) {
        const d = now.clone().subtract(i, "days");
        buckets.push({
          start: d.clone().startOf("day"),
          end: d.clone().endOf("day"),
          label: d.format(" dd").trim(),
          amount: 0,
        });
      }
    } else if (granularity === "weekly") {
      for (let i = 5; i >= 0; i--) {
        const w = now.clone().subtract(i, "weeks");
        buckets.push({
          start: w.clone().startOf("week"),
          end: w.clone().endOf("week"),
          label: w.clone().startOf("week").format("MMM D"),
          amount: 0,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const m = now.clone().subtract(i, "months");
        buckets.push({
          start: m.clone().startOf("month"),
          end: m.clone().endOf("month"),
          label: m.format("MMM"),
          amount: 0,
        });
      }
    }

    const rangeStart = buckets[0].start;
    const inRange: Expense[] = [];
    for (const e of expenses) {
      const d = moment(this.dateOf(e));
      if (d.isBefore(rangeStart) || d.isAfter(now)) {
        continue;
      }
      const bucket = buckets.find(
        (b) => d.isSameOrAfter(b.start) && d.isSameOrBefore(b.end)
      );
      if (bucket) {
        bucket.amount += e.amount || 0;
        inRange.push(e);
      }
    }

    const points = buckets.map((b) => ({ label: b.label, amount: b.amount }));
    const total = points.reduce((s, p) => s + p.amount, 0);
    let peakIndex = 0;
    points.forEach((p, i) => {
      if (p.amount > points[peakIndex].amount) {
        peakIndex = i;
      }
    });

    return {
      granularity,
      points,
      total,
      peakIndex,
      breakdown: this.buildCategories(inRange, total),
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
