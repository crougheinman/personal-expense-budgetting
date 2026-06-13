import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  ViewChild,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

type Col = "month" | "day" | "year";

/**
 * A reusable iOS-style wheel/roulette date picker — three vertically-scrolling
 * columns (Month · Day · Year) that share the global `.wheel` look with the
 * time picker. The day column re-sizes to the selected month/year (28-31 days,
 * leap years included). Implements ControlValueAccessor so it drops into
 * reactive forms via `formControlName`; the model value is a `Date` at local
 * midnight, so the form's date+time merge logic is unchanged.
 *
 *   <component-date-picker formControlName="expenseDate"></component-date-picker>
 */
@Component({
  selector: "component-date-picker",
  standalone: false,
  templateUrl: "./date-picker.component.html",
  styleUrl: "./date-picker.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor, AfterViewInit {
  readonly ITEM = 38; // px per row
  readonly VISIBLE = 5; // odd number of rows shown
  readonly months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  readonly years: number[];

  monthIndex = 0; // 0..11
  dayIndex = 0; // 0..(daysInMonth-1)
  yearIndex = 0; // index into `years`
  disabled = false;

  @ViewChild("monthCol") monthCol!: ElementRef<HTMLElement>;
  @ViewChild("dayCol") dayCol!: ElementRef<HTMLElement>;
  @ViewChild("yearCol") yearCol!: ElementRef<HTMLElement>;

  private viewReady = false;
  private lastEmitted = 0;
  private timers: Record<Col, ReturnType<typeof setTimeout> | null> = {
    month: null,
    day: null,
    year: null,
  };
  private onChange: (value: Date) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {
    const thisYear = new Date().getFullYear();
    this.years = [];
    for (let y = thisYear - 20; y <= thisYear + 5; y++) {
      this.years.push(y);
    }
    this.yearIndex = this.years.indexOf(thisYear);
    this.monthIndex = new Date().getMonth();
    this.dayIndex = new Date().getDate() - 1;
  }

  get padPx(): number {
    return Math.floor(this.VISIBLE / 2) * this.ITEM;
  }

  get wheelHeight(): number {
    return this.VISIBLE * this.ITEM;
  }

  /** Day labels (1..N) for the currently-selected month & year. */
  get days(): number[] {
    const count = this.daysInMonth(this.monthIndex, this.years[this.yearIndex]);
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.lastEmitted = this.compose().getTime();
    this.syncScrollPositions();
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: Date | string | null): void {
    const date = this.toDate(value);
    this.monthIndex = date.getMonth();
    this.yearIndex = this.clampYearIndex(date.getFullYear());
    const maxDay = this.daysInMonth(this.monthIndex, this.years[this.yearIndex]);
    this.dayIndex = Math.min(date.getDate() - 1, maxDay - 1);
    this.lastEmitted = this.compose().getTime();
    this.cdr.markForCheck();
    this.syncScrollPositions();
  }

  registerOnChange(fn: (value: Date) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdr.markForCheck();
  }

  // --- Interaction ---------------------------------------------------------
  onScroll(kind: Col, el: HTMLElement): void {
    const idx = this.indexFromScroll(kind, el);
    this.setIndex(kind, idx);
    this.cdr.markForCheck();
    if (this.timers[kind]) {
      clearTimeout(this.timers[kind]!);
    }
    this.timers[kind] = setTimeout(() => this.settle(kind, el), 130);
  }

  select(kind: Col, index: number, el: HTMLElement): void {
    if (this.disabled) {
      return;
    }
    this.setIndex(kind, index);
    el.scrollTo({ top: index * this.ITEM, behavior: "smooth" });
    this.reconcileDay();
    this.emit();
    this.onTouched();
    this.cdr.markForCheck();
  }

  trackByNum(_i: number, n: number): number {
    return n;
  }

  // --- Internals -----------------------------------------------------------
  private settle(kind: Col, el: HTMLElement): void {
    const idx = this.indexFromScroll(kind, el);
    this.setIndex(kind, idx);
    const target = idx * this.ITEM;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
    this.reconcileDay();
    this.emit();
    this.onTouched();
    this.cdr.markForCheck();
  }

  /** When month/year shrinks the day count, clamp the day and re-snap it. */
  private reconcileDay(): void {
    const maxDay = this.daysInMonth(this.monthIndex, this.years[this.yearIndex]);
    if (this.dayIndex > maxDay - 1) {
      this.dayIndex = maxDay - 1;
    }
    if (this.viewReady && this.dayCol) {
      const target = this.dayIndex * this.ITEM;
      if (Math.abs(this.dayCol.nativeElement.scrollTop - target) > 1) {
        this.dayCol.nativeElement.scrollTop = target;
      }
    }
  }

  private indexFromScroll(kind: Col, el: HTMLElement): number {
    const raw = Math.round(el.scrollTop / this.ITEM);
    return Math.min(Math.max(raw, 0), this.maxIndex(kind));
  }

  private setIndex(kind: Col, idx: number): void {
    if (kind === "month") {
      this.monthIndex = idx;
    } else if (kind === "day") {
      this.dayIndex = idx;
    } else {
      this.yearIndex = idx;
    }
  }

  private maxIndex(kind: Col): number {
    if (kind === "month") {
      return 11;
    }
    if (kind === "year") {
      return this.years.length - 1;
    }
    return this.daysInMonth(this.monthIndex, this.years[this.yearIndex]) - 1;
  }

  private syncScrollPositions(): void {
    if (!this.viewReady) {
      return;
    }
    if (this.monthCol) {
      this.monthCol.nativeElement.scrollTop = this.monthIndex * this.ITEM;
    }
    if (this.dayCol) {
      this.dayCol.nativeElement.scrollTop = this.dayIndex * this.ITEM;
    }
    if (this.yearCol) {
      this.yearCol.nativeElement.scrollTop = this.yearIndex * this.ITEM;
    }
  }

  private emit(): void {
    const date = this.compose();
    if (date.getTime() !== this.lastEmitted) {
      this.lastEmitted = date.getTime();
      this.onChange(date);
    }
  }

  private compose(): Date {
    return new Date(this.years[this.yearIndex], this.monthIndex, this.dayIndex + 1);
  }

  private daysInMonth(monthIndex: number, year: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  private clampYearIndex(year: number): number {
    const i = this.years.indexOf(year);
    if (i !== -1) {
      return i;
    }
    return year < this.years[0] ? 0 : this.years.length - 1;
  }

  private toDate(value: Date | string | null): Date {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "string") {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return new Date();
  }
}
