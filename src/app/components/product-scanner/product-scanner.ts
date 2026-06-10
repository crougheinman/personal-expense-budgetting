import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
  OnDestroy,
} from "@angular/core";
import { GeminiService, GeminiScanResult } from "@services";

/**
 * AI product scanner.
 *
 * Streams the camera, lets the user capture a single frame, and sends that
 * frame to Google Gemini which identifies the product. The result — product
 * name and price — is shown in the component and emitted via `detected` so the
 * host form can auto-fill itself.
 */
@Component({
  selector: "app-product-scanner",
  standalone: false,
  templateUrl: "./product-scanner.html",
  styleUrl: "./product-scanner.scss",
})
export class ProductScanner implements OnDestroy {
  /** Emits the product Gemini identified (name + price). */
  @Output() detected = new EventEmitter<GeminiScanResult>();
  @Output() error = new EventEmitter<string>();

  isScanning = false;
  isProcessing = false;
  result: GeminiScanResult | null = null;

  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  constructor(
    private geminiService: GeminiService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Opens the camera so the user can aim at a product. */
  async startScan(): Promise<void> {
    if (this.isScanning) return;

    if (!this.geminiService.isConfigured) {
      this.error.emit(
        "Gemini API key is missing. Add it to environment.ts (geminiApiKey)."
      );
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
        audio: false,
      });
    } catch {
      this.error.emit("Camera access denied or not available.");
      return;
    }

    this.isScanning = true;
    this.result = null;
    this.cdr.detectChanges();

    // The <video> element only exists once *ngIf renders it.
    setTimeout(() => {
      this.videoElement = document.getElementById(
        "productScannerVideo"
      ) as HTMLVideoElement | null;
      if (this.videoElement && this.stream) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play().catch(() => undefined);
      }
    });
  }

  /** Captures the current frame and asks Gemini to identify the product. */
  async captureAndIdentify(): Promise<void> {
    if (!this.isScanning || this.isProcessing || !this.videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth || 1280;
    canvas.height = this.videoElement.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) {
      this.error.emit("Could not capture the image.");
      return;
    }
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

    this.isProcessing = true;
    this.cdr.detectChanges();

    try {
      const product = await this.geminiService.identifyItem(
        base64,
        "image/jpeg"
      );
      this.result = product;
      this.detected.emit(product);
      this.stopScan();
    } catch (err) {
      this.error.emit(
        err instanceof Error ? err.message : "Failed to identify the product."
      );
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  stopScan(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isScanning = false;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
}
