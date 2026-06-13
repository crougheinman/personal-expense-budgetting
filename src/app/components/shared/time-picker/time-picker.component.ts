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

type Meridiem = "AM" | "PM";
type Col = "hour" | "min" | "mer";

/**
 * A reusable iOS-style wheel/roulette time picker. Three vertically-scrolling
 * columns — hour (1-12), minute (0-59), AM/PM — each snapping the centred item
 * as the selection. Implements ControlValueAccessor so it drops into reactive
 * forms via `formControlName`; the model value is a 24-hour `"HH:mm"` string
 * (matching `<input type="time">`, so existing merge logic is unchanged).
 *
 *   <component-time-picker formControlName="expenseTime"></component-time-picker>
 */
@Component({
  selector: "component-time-picker",
  standalone: false,
  templateUrl: "./time-picker.component.html",
  styleUrl: "./time-picker.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
})
export class TimePickerComponent implements ControlValueAccessor, AfterViewInit {
  readonly ITEM = 38; // px per row
  readonly VISIBLE = 5; // odd number of rows shown
  readonly hours = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly minutes = Array.from({ length: 60 }, (_, i) => i);
  readonly meridiems: Meridiem[] = ["AM", "PM"];

  hourIndex = 0; // 0..11  → hour 1..12
  minuteIndex = 0; // 0..59
  meridiemIndex = 0; // 0 = AM, 1 = PM
  disabled = false;

  @ViewChild("hourCol") hourCol!: ElementRef<HTMLElement>;
  @ViewChild("minCol") minCol!: ElementRef<HTMLElement>;
  @ViewChild("merCol") merCol!: ElementRef<HTMLElement>;

  private viewReady = false;
  private lastEmitted = "";
  private timers: Record<Col, ReturnType<typeof setTimeout> | null> = {
    hour: null,
    min: null,
    mer: null,
  };
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  /** Vertical padding so the first/last item can scroll to the centre band. */
  get padPx(): number {
    return Math.floor(this.VISIBLE / 2) * this.ITEM;
  }

  get wheelHeight(): number {
    return this.VISIBLE * this.ITEM;
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.lastEmitted = this.compose();
    this.syncScrollPositions();
  }

  // --- ControlValueAccessor ------------------------------------------------
  writeValue(value: string | null): void {
    const { h12, minute, meridiem } = this.parse(value);
    this.hourIndex = h12 - 1;
    this.minuteIndex = minute;
    this.meridiemIndex = meridiem === "AM" ? 0 : 1;
    this.lastEmitted = this.compose();
    this.cdr.markForCheck();
    this.syncScrollPositions();
  }

  registerOnChange(fn: (value: string) => void): void {
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
  /** A column was scrolled — update the highlight live, finalise on settle. */
  onScroll(kind: Col, el: HTMLElement): void {
    const idx = this.indexFromScroll(kind, el);
    this.setIndex(kind, idx);
    this.cdr.markForCheck();
    if (this.timers[kind]) {
      clearTimeout(this.timers[kind]!);
    }
    this.timers[kind] = setTimeout(() => this.settle(kind, el), 130);
  }

  /** Tapping an item scrolls it to the centre and commits. */
  select(kind: Col, index: number, el: HTMLElement): void {
    if (this.disabled) {
      return;
    }
    this.setIndex(kind, index);
    el.scrollTo({ top: index * this.ITEM, behavior: "smooth" });
    this.emit();
    this.onTouched();
    this.cdr.markForCheck();
  }

  pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  // --- Internals -----------------------------------------------------------
  private settle(kind: Col, el: HTMLElement): void {
    const idx = this.indexFromScroll(kind, el);
    this.setIndex(kind, idx);
    const target = idx * this.ITEM;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
    this.emit();
    this.onTouched();
    this.cdr.markForCheck();
  }

  private indexFromScroll(kind: Col, el: HTMLElement): number {
    const raw = Math.round(el.scrollTop / this.ITEM);
    return Math.min(Math.max(raw, 0), this.maxIndex(kind));
  }

  private setIndex(kind: Col, idx: number): void {
    if (kind === "hour") {
      this.hourIndex = idx;
    } else if (kind === "min") {
      this.minuteIndex = idx;
    } else {
      this.meridiemIndex = idx;
    }
  }

  private maxIndex(kind: Col): number {
    return kind === "hour" ? 11 : kind === "min" ? 59 : 1;
  }

  private syncScrollPositions(): void {
    if (!this.viewReady) {
      return;
    }
    if (this.hourCol) {
      this.hourCol.nativeElement.scrollTop = this.hourIndex * this.ITEM;
    }
    if (this.minCol) {
      this.minCol.nativeElement.scrollTop = this.minuteIndex * this.ITEM;
    }
    if (this.merCol) {
      this.merCol.nativeElement.scrollTop = this.meridiemIndex * this.ITEM;
    }
  }

  private emit(): void {
    const value = this.compose();
    if (value !== this.lastEmitted) {
      this.lastEmitted = value;
      this.onChange(value);
    }
  }

  private compose(): string {
    const h12 = this.hourIndex + 1;
    const meridiem = this.meridiems[this.meridiemIndex];
    const h24 =
      meridiem === "AM"
        ? h12 === 12
          ? 0
          : h12
        : h12 === 12
          ? 12
          : h12 + 12;
    return `${this.pad2(h24)}:${this.pad2(this.minuteIndex)}`;
  }

  private parse(value: string | null): {
    h12: number;
    minute: number;
    meridiem: Meridiem;
  } {
    let h24 = NaN;
    let minute = NaN;
    if (value && /^\d{1,2}:\d{2}/.test(value)) {
      const [hh, mm] = value.split(":");
      h24 = parseInt(hh, 10);
      minute = parseInt(mm, 10);
    }
    if (isNaN(h24)) {
      h24 = new Date().getHours();
    }
    if (isNaN(minute)) {
      minute = 0;
    }
    const meridiem: Meridiem = h24 < 12 ? "AM" : "PM";
    let h12 = h24 % 12;
    if (h12 === 0) {
      h12 = 12;
    }
    return { h12, minute, meridiem };
  }
}
