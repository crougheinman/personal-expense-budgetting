import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService, ReceiptScanService } from '@services';
import { ExpensesCreateComponent, VoiceExpenseComponent, ReceiptScannerComponent } from '@app/components';

@Component({
  selector: 'pages-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class ExpensesComponent {
  /** Whether the speed-dial actions are expanded. */
  fabOpen = false;

  constructor(
    private dialogService: DialogService,
    private scanService: ReceiptScanService,
  ) {}

  toggleFab(): void {
    this.fabOpen = !this.fabOpen;
  }

  closeFab(): void {
    this.fabOpen = false;
  }

  /** Runs the chosen speed-dial action, collapsing the dial first. */
  runAction(action: "manual" | "receipt" | "voice"): void {
    this.fabOpen = false;
    if (action === "manual") {
      this.openAddExpenseDialog();
    } else if (action === "receipt") {
      this.openReceiptScanner();
    } else {
      this.openVoiceExpenseDialog();
    }
  }

  openAddExpenseDialog(): void {
    this.dialogService.open(ExpensesCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
            mobileFullscreen: true,
            showCloseButton: true,
        })
  }

  openVoiceExpenseDialog(): void {
    this.dialogService.open(VoiceExpenseComponent, {
      width: '420px',
      mobileFullscreen: false,
      showCloseButton: true,
    });
  }

  openReceiptScanner(): void {
    // A scan dialog is already mounted (or reopening a background one): the
    // service-backed dialog shows the live state, so never stack a second.
    if (this.scanService.dialogOpen) {
      return;
    }
    this.dialogService.open(ReceiptScannerComponent, {
      width: '940px',
      height: '88vh',
      maxWidth: '96vw',
      mobileFullscreen: true,
      showCloseButton: false,
      panelClass: 'receipt-dialog',
    });
  }
}


