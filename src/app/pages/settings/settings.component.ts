import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from "@angular/core";
import { SettingsFacade } from "./settings.facade";

type RunStatus = "idle" | "running" | "done" | "error";

@Component({
  selector: "pages-settings",
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsFacade],
})
export class SettingsComponent {
  status: RunStatus = "idle";
  message = "";
  geminiConfigured: boolean;

  constructor(
    private facade: SettingsFacade,
    private cdr: ChangeDetectorRef
  ) {
    this.geminiConfigured = this.facade.geminiConfigured;
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
