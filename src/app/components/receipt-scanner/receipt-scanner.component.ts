import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from "@angular/core";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import moment from "moment";
import { EXPENSE_CATEGORIES } from "@models";
import { GeminiLimitError, ReceiptScanResult } from "@services";
import { ReceiptScannerFacade } from "./receipt-scanner.facade";

type ReceiptStatus =
  | "upload"
  | "processing"
  | "review"
  | "empty"
  | "saving"
  | "error";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

@Component({
  selector: "app-receipt-scanner",
  templateUrl: "./receipt-scanner.component.html",
  styleUrl: "./receipt-scanner.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReceiptScannerFacade],
})
export class ReceiptScannerComponent {
  status: ReceiptStatus = "upload";
  previewUrl: string | null = null;
  isPdf = false;
  fileName = "";
  errorMessage = "";
  isDragging = false;
  zoomed = false;
  bulkCategory = "";

  readonly categories = EXPENSE_CATEGORIES;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private facade: ReceiptScannerFacade,
    private dialogRef: MatDialogRef<ReceiptScannerComponent>,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({ items: this.fb.array([]) });
  }

  get geminiConfigured(): boolean {
    return this.facade.geminiConfigured;
  }

  get itemsArray(): FormArray {
    return this.form.get("items") as FormArray;
  }

  get itemControls(): FormGroup[] {
    return this.itemsArray.controls as FormGroup[];
  }

  // ---- File input ----------------------------------------------------------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
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
      this.handleFile(file);
    } else {
      this.cdr.detectChanges();
    }
  }

  private async handleFile(file: File): Promise<void> {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.fail("Please upload a JPEG, PNG, or PDF receipt.");
      return;
    }
    if (!this.geminiConfigured) {
      this.fail("Add a Google Gemini API key to scan receipts.");
      return;
    }

    let read: { base64: string; dataUrl: string };
    try {
      read = await this.readFile(file);
    } catch {
      this.fail("Could not read the file.");
      return;
    }

    this.fileName = file.name;
    this.isPdf = file.type === "application/pdf";
    this.previewUrl = read.dataUrl;
    this.zoomed = false;
    this.errorMessage = "";
    this.status = "processing";
    this.cdr.detectChanges();

    try {
      const result = await this.facade.scan(read.base64, file.type);
      this.buildForm(result);
      this.status = this.itemControls.length > 0 ? "review" : "empty";
    } catch (err) {
      this.status = "error";
      this.errorMessage = this.describeScanError(err);
    } finally {
      this.cdr.detectChanges();
    }
  }

  /**
   * Turns a scan failure into a clear, user-facing message. The on-device model
   * is text-only, so it can't read a receipt image — there's no local backup for
   * scanning, and we say so honestly when the cloud quota is exhausted.
   */
  private describeScanError(err: unknown): string {
    if (err instanceof GeminiLimitError) {
      return (
        "The AI scanning service is over its usage limit right now. Receipt " +
        "scanning needs to read the image, which the on-device AI can't do, so " +
        "there's no offline backup for it. Please wait a minute and try again — " +
        "or add the items manually."
      );
    }
    return err instanceof Error ? err.message : "Could not read the receipt.";
  }

  private readFile(file: File): Promise<{ base64: string; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ dataUrl, base64: dataUrl.split(",")[1] ?? "" });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private buildForm(result: ReceiptScanResult): void {
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

  // ---- Review interactions -------------------------------------------------
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
    // checkbox CVA already updated the model; refresh footer totals.
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

  // ---- Save / close --------------------------------------------------------
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

    this.status = "saving";
    this.cdr.detectChanges();
    try {
      const items = selected.map((g) => ({
        description: g.get("description")?.value,
        amount: Number(g.get("amount")?.value),
        category: g.get("category")?.value,
        date: g.get("date")?.value || null,
      }));
      const count = await this.facade.bulkAdd(items);
      this.dialogRef.close(count);
    } catch {
      this.status = "review";
      this.errorMessage = "Failed to add the expenses. Please try again.";
      this.cdr.detectChanges();
    }
  }

  reset(): void {
    this.itemsArray.clear();
    this.previewUrl = null;
    this.isPdf = false;
    this.fileName = "";
    this.errorMessage = "";
    this.bulkCategory = "";
    this.zoomed = false;
    this.status = "upload";
    this.cdr.detectChanges();
  }

  toggleZoom(): void {
    this.zoomed = !this.zoomed;
  }

  close(): void {
    this.dialogRef.close();
  }

  private fail(message: string): void {
    this.status = "error";
    this.errorMessage = message;
    this.cdr.detectChanges();
  }
}
