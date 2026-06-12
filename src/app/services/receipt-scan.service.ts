import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { EXPENSE_CATEGORIES } from "@models";
import {
  GeminiLimitError,
  GeminiService,
  ReceiptScanResult,
} from "./gemini.service";

export type ReceiptScanStatus =
  | "idle"
  | "processing"
  | "ready" // items extracted, awaiting review
  | "empty" // scan succeeded but no line items
  | "error";

export interface ReceiptScanState {
  status: ReceiptScanStatus;
  fileName: string;
  previewUrl: string | null;
  isPdf: boolean;
  result: ReceiptScanResult | null;
  errorMessage: string;
  /** AI provider currently doing the work (Gemini, OpenRouter, Groq, NVIDIA). */
  activeProvider: string;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const INITIAL: ReceiptScanState = {
  status: "idle",
  fileName: "",
  previewUrl: null,
  isPdf: false,
  result: null,
  errorMessage: "",
  activeProvider: "",
};

/**
 * Owns the receipt-scan lifecycle at the app root so a scan keeps running in the
 * background after the dialog is minimized/closed, and the result survives until
 * the user reviews it. The dialog and the global strip are both views over this.
 */
@Injectable({ providedIn: "root" })
export class ReceiptScanService {
  private readonly state$ = new BehaviorSubject<ReceiptScanState>(INITIAL);
  readonly state: Observable<ReceiptScanState> = this.state$.asObservable();

  /** True while a scan-review dialog instance is mounted (prevents duplicates). */
  dialogOpen = false;

  constructor(private gemini: GeminiService) {}

  get snapshot(): ReceiptScanState {
    return this.state$.value;
  }

  /** A scan is in flight — used to disable the "Scan Receipt" trigger. */
  get isProcessing(): boolean {
    return this.state$.value.status === "processing";
  }

  /** There is unreviewed state (processing or a finished result) to return to. */
  get isActive(): boolean {
    return this.state$.value.status !== "idle";
  }

  setDialogOpen(open: boolean): void {
    this.dialogOpen = open;
    // Nudge subscribers (the strip) so they re-evaluate visibility when the
    // dialog is minimized/closed without a status change.
    this.state$.next({ ...this.state$.value });
  }

  reset(): void {
    this.state$.next(INITIAL);
  }

  setError(message: string): void {
    this.state$.next({ ...this.state$.value, status: "error", errorMessage: message });
  }

  /** Reads a file and runs the AI scan; state drives all UI. Never throws. */
  async startScan(file: File): Promise<void> {
    if (this.isProcessing) {
      return; // one scan at a time
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.setError("Please upload a JPEG, PNG, or PDF receipt.");
      return;
    }
    if (!this.gemini.isConfigured) {
      this.setError("Add a Google Gemini API key to scan receipts.");
      return;
    }

    let read: { base64: string; dataUrl: string };
    try {
      read = await this.readFile(file);
    } catch {
      this.setError("Could not read the file.");
      return;
    }

    this.state$.next({
      status: "processing",
      fileName: file.name,
      previewUrl: read.dataUrl,
      isPdf: file.type === "application/pdf",
      result: null,
      errorMessage: "",
      activeProvider: "Gemini",
    });

    try {
      const result = await this.gemini.scanReceipt(
        read.base64,
        file.type,
        EXPENSE_CATEGORIES,
        (name) => {
          // Report each provider the scan hands off to (drives the robot swap).
          if (this.state$.value.status === "processing") {
            this.state$.next({ ...this.state$.value, activeProvider: name });
          }
        }
      );
      const hasItems = result.items.length > 0;
      this.state$.next({
        ...this.state$.value,
        status: hasItems ? "ready" : "empty",
        result,
        errorMessage: hasItems ? "" : "No line items were found on this receipt.",
      });
    } catch (err) {
      this.state$.next({
        ...this.state$.value,
        status: "error",
        errorMessage: this.describeError(err),
      });
    }
  }

  private describeError(err: unknown): string {
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
}
