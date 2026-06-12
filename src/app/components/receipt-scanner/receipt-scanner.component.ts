import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import moment from "moment";
import { EXPENSE_CATEGORIES } from "@models";
import { ReceiptScanService, ReceiptScanState } from "@services";
import { ReceiptScannerFacade } from "./receipt-scanner.facade";

type ReceiptView =
  | "upload"
  | "processing"
  | "review"
  | "empty"
  | "saving"
  | "error";

@Component({
  selector: "app-receipt-scanner",
  templateUrl: "./receipt-scanner.component.html",
  styleUrl: "./receipt-scanner.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReceiptScannerFacade],
})
export class ReceiptScannerComponent implements OnInit, OnDestroy {
  state: ReceiptScanState;
  saving = false;
  isDragging = false;
  zoomed = false;
  bulkCategory = "";

  readonly categories = EXPENSE_CATEGORIES;
  form: FormGroup;

  // Robot animation: which provider's robot is on screen + swap phase.
  displayProvider = "";
  robotPhase: "idle" | "out" | "in" = "idle";

  private sub?: Subscription;
  private swapTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private fb: FormBuilder,
    private facade: ReceiptScannerFacade,
    private scanService: ReceiptScanService,
    private dialogRef: MatDialogRef<ReceiptScannerComponent>,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({ items: this.fb.array([]) });
    this.state = this.scanService.snapshot;
  }

  ngOnInit(): void {
    this.scanService.setDialogOpen(true);
    this.sub = this.scanService.state.subscribe((s) => {
      this.state = s;
      if (s.status === "ready" && s.result && this.itemsArray.length === 0) {
        this.buildForm();
      }
      if (s.status === "idle") {
        this.itemsArray.clear();
      }
      this.syncRobot(s);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearSwapTimers();
    this.scanService.setDialogOpen(false);
  }

  /** CSS tint class for the current robot (per provider). */
  get robotClass(): string {
    return "rp-" + (this.displayProvider || "Gemini").toLowerCase();
  }

  /** Swaps robots when the active provider changes: collapse old, enter new. */
  private syncRobot(s: ReceiptScanState): void {
    if (s.status !== "processing") {
      if (s.status === "idle") {
        this.displayProvider = "";
        this.robotPhase = "idle";
      }
      return;
    }
    const provider = s.activeProvider;
    if (!provider || provider === this.displayProvider) {
      return;
    }
    this.clearSwapTimers();

    if (!this.displayProvider) {
      // First robot walks in.
      this.displayProvider = provider;
      this.robotPhase = "in";
      this.after(520, () => (this.robotPhase = "idle"));
      return;
    }

    // Hand-off: collapse the current robot, then bring the next one in.
    this.robotPhase = "out";
    this.after(460, () => {
      this.displayProvider = provider;
      this.robotPhase = "in";
      this.after(520, () => (this.robotPhase = "idle"));
    });
  }

  private after(ms: number, fn: () => void): void {
    this.swapTimers.push(
      setTimeout(() => {
        fn();
        this.cdr.detectChanges();
      }, ms)
    );
  }

  private clearSwapTimers(): void {
    this.swapTimers.forEach((t) => clearTimeout(t));
    this.swapTimers = [];
  }

  // ---- Derived view ----
  get view(): ReceiptView {
    if (this.saving) {
      return "saving";
    }
    switch (this.state.status) {
      case "idle":
        return "upload";
      case "processing":
        return "processing";
      case "ready":
        return "review";
      case "empty":
        return "empty";
      default:
        return "error";
    }
  }

  get geminiConfigured(): boolean {
    return this.facade.geminiConfigured;
  }

  get previewUrl(): string | null {
    return this.state.previewUrl;
  }
  get isPdf(): boolean {
    return this.state.isPdf;
  }
  get fileName(): string {
    return this.state.fileName;
  }
  get errorMessage(): string {
    return this.state.errorMessage;
  }

  get itemsArray(): FormArray {
    return this.form.get("items") as FormArray;
  }
  get itemControls(): FormGroup[] {
    return this.itemsArray.controls as FormGroup[];
  }

  // ---- File input ----
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.scanService.startScan(file);
    }
    input.value = "";
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isDragging) {
      this.isDragging = true;
      this.cdr.detectChanges();
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.scanService.startScan(file);
    }
    this.cdr.detectChanges();
  }

  /** Hide the dialog but keep the scan running in the background. */
  minimize(): void {
    this.dialogRef.close("minimized");
  }

  private buildForm(): void {
    const result = this.state.result;
    if (!result) {
      return;
    }
    const fallbackDate = result.date || moment().format("YYYY-MM-DD");
    this.itemsArray.clear();
    for (const item of result.items) {
      this.itemsArray.push(
        this.fb.group({
          selected: [true],
          description: [item.description, Validators.required],
          date: [item.date || fallbackDate],
          amount: [item.amount, [Validators.required, Validators.min(0)]],
          category: [item.category || "default"],
          uncertain: [item.uncertainFields || []],
        })
      );
    }
  }

  // ---- Review interactions ----
  isUncertain(group: FormGroup, field: string): boolean {
    const flags = group.get("uncertain")?.value as string[] | undefined;
    return !!flags && flags.includes(field);
  }

  removeRow(index: number): void {
    this.itemsArray.removeAt(index);
    this.cdr.detectChanges();
  }

  get selectedCount(): number {
    return this.itemControls.filter((g) => g.get("selected")?.value).length;
  }

  get selectedTotal(): number {
    return this.itemControls
      .filter((g) => g.get("selected")?.value)
      .reduce((sum, g) => sum + (Number(g.get("amount")?.value) || 0), 0);
  }

  get allSelected(): boolean {
    return (
      this.itemControls.length > 0 &&
      this.itemControls.every((g) => g.get("selected")?.value)
    );
  }

  get someSelected(): boolean {
    const n = this.selectedCount;
    return n > 0 && n < this.itemControls.length;
  }

  onSelectAllChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.itemControls.forEach((g) => g.get("selected")?.setValue(checked));
    this.cdr.detectChanges();
  }

  onRowSelectChange(): void {
    this.cdr.detectChanges();
  }

  onBulkCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.bulkCategory = value;
    if (!value) {
      return;
    }
    this.itemControls.forEach((g) => {
      if (g.get("selected")?.value) {
        g.get("category")?.setValue(value);
      }
    });
    this.cdr.detectChanges();
  }

  // ---- Save / close ----
  async bulkAdd(): Promise<void> {
    const selected = this.itemControls.filter((g) => g.get("selected")?.value);
    if (selected.length === 0) {
      return;
    }
    const hasInvalid = selected.some(
      (g) => g.get("description")?.invalid || g.get("amount")?.invalid
    );
    if (hasInvalid) {
      selected.forEach((g) => g.markAllAsTouched());
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();
    try {
      const items = selected.map((g) => ({
        description: g.get("description")?.value,
        amount: Number(g.get("amount")?.value),
        category: g.get("category")?.value,
        date: g.get("date")?.value || null,
      }));
      const count = await this.facade.bulkAdd(items);
      this.scanService.reset();
      this.dialogRef.close(count);
    } catch {
      this.saving = false;
      this.scanService.setError("Failed to add the expenses. Please try again.");
      this.cdr.detectChanges();
    }
  }

  /** Discard the current scan and return to the upload step. */
  reset(): void {
    this.itemsArray.clear();
    this.bulkCategory = "";
    this.zoomed = false;
    this.scanService.reset();
    this.cdr.detectChanges();
  }

  toggleZoom(): void {
    this.zoomed = !this.zoomed;
  }

  /** Cancel: discard the scan and close. */
  close(): void {
    this.scanService.reset();
    this.dialogRef.close();
  }
}
