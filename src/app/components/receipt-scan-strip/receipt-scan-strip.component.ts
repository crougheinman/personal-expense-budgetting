import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subscription } from "rxjs";
import { DialogService, ReceiptScanService, ReceiptScanState } from "@services";
import { ReceiptScannerComponent } from "../receipt-scanner/receipt-scanner.component";

/**
 * App-wide strip shown while a receipt scan runs in the background (after the
 * dialog is minimized). It shimmers to signal activity, lets the user reopen the
 * scanner, and auto-pops the result dialog the moment the scan finishes.
 */
@Component({
  selector: "component-receipt-scan-strip",
  templateUrl: "./receipt-scan-strip.component.html",
  styleUrl: "./receipt-scan-strip.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptScanStripComponent implements OnInit, OnDestroy {
  state!: ReceiptScanState;
  private sub?: Subscription;

  constructor(
    public scanService: ReceiptScanService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.state = this.scanService.snapshot;
    this.sub = this.scanService.state.subscribe((s) => {
      this.state = s;
      // Auto-popup the result when a background scan finishes while minimized.
      if (
        !this.scanService.dialogOpen &&
        (s.status === "ready" || s.status === "empty" || s.status === "error")
      ) {
        this.openScanner();
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Visible only while a scan is processing and the dialog is minimized. */
  get showStrip(): boolean {
    return this.state.status === "processing" && !this.scanService.dialogOpen;
  }

  reopen(): void {
    this.openScanner();
  }

  private openScanner(): void {
    if (this.scanService.dialogOpen) {
      return;
    }
    this.dialogService.open(ReceiptScannerComponent, {
      width: "940px",
      height: "88vh",
      maxWidth: "96vw",
      mobileFullscreen: true,
      showCloseButton: false,
      panelClass: "receipt-dialog",
    });
  }
}
