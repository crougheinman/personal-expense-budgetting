import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";

/**
 * Swipe-a-row-to-the-right-to-delete gesture, reusable across the expense, bill
 * and inventory lists. Works with both touch and mouse via Pointer Events.
 *
 * The host element is the sliding foreground. Place a "delete" affordance as a
 * sibling *behind* it (revealed as the host slides right). Bind:
 *   <div class="bg" [class.armed]="sw.armed"></div>
 *   <div appSwipeToDelete #sw="swipeToDelete"
 *        (tap)="open(item)" (swipeDelete)="confirmDelete(item)"> ... </div>
 *
 * - `(tap)`         a clean press with no swipe — use it to open/edit.
 * - `(swipeDelete)` the row was dragged past the delete threshold and released.
 * - `armed`         true once dragged far enough to trigger deletion (for styling).
 *
 * Direction is locked on the first movement so vertical scrolling is preserved
 * (pair with `touch-action: pan-y` on the host); only a clear rightward drag is
 * treated as a swipe.
 */
@Directive({
  selector: "[appSwipeToDelete]",
  standalone: false,
  exportAs: "swipeToDelete",
})
export class SwipeToDeleteDirective {
  /** When true, the gesture is disabled (taps still pass through as clicks). */
  @Input("appSwipeToDeleteDisabled") disabled = false;

  @Output() tap = new EventEmitter<void>();
  @Output() swipeDelete = new EventEmitter<void>();

  /** Current rightward offset (px). */
  dragX = 0;
  /** True while an active horizontal drag is in progress. */
  dragging = false;

  private readonly TRIGGER = 104; // px before deletion is armed
  private readonly MAX = 140; // px the row can travel
  private startX = 0;
  private startY = 0;
  private axis: "none" | "h" | "v" = "none";
  private active = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  /** True once dragged far enough that releasing will trigger deletion. */
  get armed(): boolean {
    return this.dragX >= this.TRIGGER;
  }

  @HostListener("pointerdown", ["$event"])
  onPointerDown(event: PointerEvent): void {
    if (this.disabled) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    this.active = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.axis = "none";
    this.dragX = 0;
  }

  @HostListener("pointermove", ["$event"])
  onPointerMove(event: PointerEvent): void {
    if (!this.active) {
      return;
    }
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    if (this.axis === "none") {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
        return; // too small to decide a direction yet
      }
      if (Math.abs(dx) > Math.abs(dy) && dx > 0) {
        this.axis = "h";
        this.dragging = true;
        this.el.nativeElement.classList.add("is-dragging");
        this.el.nativeElement.setPointerCapture?.(event.pointerId);
      } else {
        // Vertical (or leftward) → let the list scroll; abandon the swipe.
        this.axis = "v";
        this.active = false;
        return;
      }
    }

    if (this.axis !== "h") {
      return;
    }
    this.dragX = Math.max(0, Math.min(dx, this.MAX));
    this.el.nativeElement.style.transform = `translateX(${this.dragX}px)`;
  }

  @HostListener("pointerup")
  onPointerUp(): void {
    if (this.axis === "h" && this.dragging) {
      const armed = this.armed;
      const moved = this.dragX > 6;
      this.reset();
      if (armed) {
        this.swipeDelete.emit();
      } else if (!moved) {
        this.tap.emit();
      }
    } else if (this.active && this.axis === "none") {
      // A plain press with no drag → treat as a tap.
      this.tap.emit();
    }
    this.active = false;
    this.axis = "none";
  }

  @HostListener("pointercancel")
  onPointerCancel(): void {
    this.reset();
    this.active = false;
    this.axis = "none";
  }

  private reset(): void {
    this.dragging = false;
    this.dragX = 0;
    const node = this.el.nativeElement;
    node.classList.remove("is-dragging");
    node.style.transform = "";
  }
}
