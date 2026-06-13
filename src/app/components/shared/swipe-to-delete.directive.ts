import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";

/**
 * Horizontal swipe gesture, reusable across the expense, bill and inventory
 * lists. Works with both touch and mouse via Pointer Events.
 *
 * Swipe RIGHT to delete; optionally swipe LEFT to edit (opt-in via
 * `[appSwipeLeftEnabled]="true"`). The host element is the sliding foreground;
 * place a "delete" affordance behind it (revealed sliding right) and, when the
 * left swipe is enabled, an "edit" affordance behind it too (revealed sliding
 * left). Bind:
 *   <div class="bg-delete" [class.armed]="sw.armed"></div>
 *   <div class="bg-edit"   [class.armed]="sw.armedLeft"></div>
 *   <div appSwipeToDelete #sw="swipeToDelete" [appSwipeLeftEnabled]="true"
 *        (tap)="open(item)" (swipeDelete)="confirmDelete(item)"
 *        (swipeEdit)="edit(item)"> ... </div>
 *
 * - `(tap)`         a clean press with no swipe — use it to open a detail view.
 * - `(swipeDelete)` dragged past the threshold to the RIGHT and released.
 * - `(swipeEdit)`   dragged past the threshold to the LEFT and released.
 * - `armed`         dragged far enough RIGHT to trigger deletion (for styling).
 * - `armedLeft`     dragged far enough LEFT to trigger edit (for styling).
 *
 * Direction is locked on the first movement so vertical scrolling is preserved
 * (pair with `touch-action: pan-y` on the host).
 */
@Directive({
  selector: "[appSwipeToDelete]",
  standalone: false,
  exportAs: "swipeToDelete",
})
export class SwipeToDeleteDirective {
  /** When true, the gesture is disabled (taps still pass through as clicks). */
  @Input("appSwipeToDeleteDisabled") disabled = false;

  /** Opt-in: allow a leftward swipe that emits `(swipeEdit)`. Off by default. */
  @Input("appSwipeLeftEnabled") leftEnabled = false;

  @Output() tap = new EventEmitter<void>();
  @Output() swipeDelete = new EventEmitter<void>();
  @Output() swipeEdit = new EventEmitter<void>();

  /** Current horizontal offset (px): positive = right, negative = left. */
  dragX = 0;
  /** True while an active horizontal drag is in progress. */
  dragging = false;

  private readonly TRIGGER = 104; // px before an action is armed
  private readonly MAX = 140; // px the row can travel
  private startX = 0;
  private startY = 0;
  private axis: "none" | "h" | "v" = "none";
  private active = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  /** True once dragged far enough RIGHT that releasing will delete. */
  get armed(): boolean {
    return this.dragX >= this.TRIGGER;
  }

  /** True once dragged far enough LEFT that releasing will edit. */
  get armedLeft(): boolean {
    return this.dragX <= -this.TRIGGER;
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
      // A clear horizontal intent: rightward always (delete); leftward only
      // when the edit swipe is enabled.
      const horizontal =
        Math.abs(dx) > Math.abs(dy) &&
        (dx > 0 || (dx < 0 && this.leftEnabled));
      if (horizontal) {
        this.axis = "h";
        this.dragging = true;
        this.el.nativeElement.classList.add("is-dragging");
        this.el.nativeElement.setPointerCapture?.(event.pointerId);
      } else {
        // Vertical (or a disabled-direction drag) → let the list scroll.
        this.axis = "v";
        this.active = false;
        return;
      }
    }

    if (this.axis !== "h") {
      return;
    }
    const lower = this.leftEnabled ? -this.MAX : 0;
    this.dragX = Math.max(lower, Math.min(dx, this.MAX));
    this.el.nativeElement.style.transform = `translateX(${this.dragX}px)`;
  }

  @HostListener("pointerup")
  onPointerUp(): void {
    if (this.axis === "h" && this.dragging) {
      const armedRight = this.armed;
      const armedLeft = this.armedLeft;
      const moved = Math.abs(this.dragX) > 6;
      this.reset();
      if (armedRight) {
        this.swipeDelete.emit();
      } else if (armedLeft) {
        this.swipeEdit.emit();
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
