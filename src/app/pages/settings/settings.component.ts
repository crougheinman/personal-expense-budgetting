import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { SettingsFacade } from "./settings.facade";
import {
  getIncomeFrequencyLabel,
  getMonthlyIncome,
  getTotalMonthlyIncome,
  Income,
  IncomeFrequency,
} from "@models";

type RunStatus = "idle" | "running" | "done" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

@Component({
  selector: "pages-settings",
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsFacade],
})
export class SettingsComponent implements OnInit, OnDestroy {
  status: RunStatus = "idle";
  message = "";
  geminiConfigured: boolean;

  /** All saved income sources. */
  incomes: Income[] = [];
  /** Id of the income being edited, or null when adding a new one. */
  editingId: string | null = null;
  incomeForm: FormGroup;
  incomeStatus: SaveStatus = "idle";
  incomeMessage = "";

  private destroy$ = new Subject<void>();

  constructor(
    private facade: SettingsFacade,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.geminiConfigured = this.facade.geminiConfigured;
    this.incomeForm = this.formBuilder.group({
      name: [""],
      amount: [null, [Validators.required, Validators.min(0)]],
      frequency: ["monthly" as IncomeFrequency, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.facade
      .getIncomes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((incomes) => {
        this.incomes = incomes;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Income helpers ------------------------------------------------------
  get totalMonthly(): number {
    return getTotalMonthlyIncome(this.incomes);
  }

  monthlyOf(income: Income): number {
    return getMonthlyIncome(income);
  }

  freqLabel(frequency: IncomeFrequency): string {
    return getIncomeFrequencyLabel(frequency);
  }

  editIncome(income: Income): void {
    this.editingId = income.id ?? null;
    this.incomeForm.patchValue({
      name: income.name ?? "",
      amount: income.amount,
      frequency: income.frequency,
    });
    this.incomeMessage = "";
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  async submitIncome(): Promise<void> {
    if (this.incomeForm.invalid || this.incomeStatus === "saving") {
      return;
    }
    const input = {
      name: (this.incomeForm.value.name || "").trim(),
      amount: Number(this.incomeForm.value.amount),
      frequency: this.incomeForm.value.frequency as IncomeFrequency,
    };
    const wasEditing = this.editingId;

    this.incomeStatus = "saving";
    this.incomeMessage = "";
    this.cdr.markForCheck();

    try {
      if (wasEditing) {
        await this.facade.updateIncome(wasEditing, input);
      } else {
        await this.facade.addIncome(input);
      }
      this.incomeStatus = "saved";
      this.incomeMessage = wasEditing ? "Salary updated." : "Salary added.";
      this.editingId = null;
      this.resetForm();
    } catch {
      this.incomeStatus = "error";
      this.incomeMessage = "Couldn't save your salary. Please try again.";
    } finally {
      this.cdr.markForCheck();
    }
  }

  async removeIncome(income: Income): Promise<void> {
    if (!income.id) {
      return;
    }
    try {
      await this.facade.deleteIncome(income.id);
      if (this.editingId === income.id) {
        this.cancelEdit();
      }
      this.incomeStatus = "saved";
      this.incomeMessage = "Salary removed.";
    } catch {
      this.incomeStatus = "error";
      this.incomeMessage = "Couldn't remove that salary.";
    } finally {
      this.cdr.markForCheck();
    }
  }

  private resetForm(): void {
    this.incomeForm.reset({ name: "", amount: null, frequency: "monthly" });
  }

  async runAutoCategorize(): Promise<void> {
    if (this.status === "running") {
      return;
    }

    this.status = "running";
    this.message = "Analyzing your expenses with AI…";
    this.cdr.detectChanges();

    try {
      const { total, updated } = await this.facade.autoCategorizeExpenses();
      this.status = "done";
      this.message =
        total === 0
          ? "All your expenses already have a category — nothing to update."
          : `Analyzed ${total} uncategorized expense${
              total === 1 ? "" : "s"
            } and updated ${updated} with a category.`;
    } catch {
      this.status = "error";
      this.message =
        "Something went wrong while categorizing. Please try again.";
    } finally {
      this.cdr.detectChanges();
    }
  }
}
