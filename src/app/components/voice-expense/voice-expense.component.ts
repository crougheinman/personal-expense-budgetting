import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { VoiceExpenseFacade } from "./voice-expense.facade";

type VoiceStatus =
  | "idle"
  | "listening"
  | "parsed"
  | "error"
  | "adding"
  | "unsupported";

@Component({
  selector: "app-voice-expense",
  templateUrl: "./voice-expense.component.html",
  styleUrl: "./voice-expense.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VoiceExpenseFacade],
})
export class VoiceExpenseComponent implements OnInit, OnDestroy {
  status: VoiceStatus = "idle";
  transcript = "";
  name = "";
  amount: number | null = null;
  errorMessage = "";

  private recognition: any = null;

  constructor(
    private facade: VoiceExpenseFacade,
    private dialogRef: MatDialogRef<VoiceExpenseComponent>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startListening();
  }

  ngOnDestroy(): void {
    this.stopListening();
    this.recognition = null;
  }

  startListening(): void {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SR) {
      this.status = "unsupported";
      this.cdr.detectChanges();
      return;
    }

    this.transcript = "";
    this.name = "";
    this.amount = null;
    this.errorMessage = "";
    this.status = "listening";
    this.cdr.detectChanges();

    this.recognition = new SR();
    this.recognition.lang = "en-US";
    this.recognition.interimResults = true;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      this.transcript = text.trim();
      this.cdr.detectChanges();
    };

    this.recognition.onerror = (event: any) => {
      this.status = "error";
      this.errorMessage =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied."
          : "Couldn't capture audio. Please try again.";
      this.cdr.detectChanges();
    };

    this.recognition.onend = () => {
      if (this.status === "listening") {
        this.finalize();
      }
    };

    try {
      this.recognition.start();
    } catch {
      // start() throws if called while already running — safe to ignore.
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }

  retry(): void {
    this.startListening();
  }

  async add(): Promise<void> {
    if (!this.name || this.amount == null) {
      return;
    }
    this.status = "adding";
    this.cdr.detectChanges();
    try {
      await this.facade.addExpense(this.name, this.amount);
      this.dialogRef.close(true);
    } catch {
      this.status = "error";
      this.errorMessage = "Failed to add the expense. Please try again.";
      this.cdr.detectChanges();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  onNameInput(event: Event): void {
    this.name = (event.target as HTMLInputElement).value;
  }

  onAmountInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.amount = Number.isFinite(value) ? value : null;
  }

  private finalize(): void {
    const { name, amount } = this.parse(this.transcript);
    this.name = name;
    this.amount = amount;

    if (name && amount != null) {
      this.status = "parsed";
    } else {
      this.status = "error";
      this.errorMessage = this.transcript
        ? 'I caught "' +
          this.transcript +
          '" but not a clear item and price. Try e.g. "Coffee 150".'
        : "I didn't hear anything. Tap the mic and try again.";
    }
    this.cdr.detectChanges();
  }

  /** Extracts a product name and price from a spoken phrase like "Coffee 150". */
  private parse(text: string): { name: string; amount: number | null } {
    const cleaned = text.trim();
    if (!cleaned) {
      return { name: "", amount: null };
    }

    const matches = [...cleaned.matchAll(/\d+(?:[.,]\d+)?/g)];
    let amount: number | null = null;
    let name = cleaned;

    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      amount = parseFloat(last[0].replace(",", "."));
      const at = last.index ?? 0;
      name = cleaned.slice(0, at) + " " + cleaned.slice(at + last[0].length);
    }

    name = name
      .replace(/[₱$€£]/g, " ")
      .replace(
        /\b(pesos?|php|dollars?|usd|euros?|bucks?|for|cost|costs?|priced?|worth|at|add|new|expense|item|the|a|an)\b/gi,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return { name, amount };
  }
}
