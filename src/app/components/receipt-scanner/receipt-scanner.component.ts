import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  ElementRef, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { Observable, Subject, takeUntil, finalize } from 'rxjs';
import { ReceiptScannerService } from '../../services/receipt-scanner.service';
import { OcrService, OcrProgress } from '../../services/ocr.service';
import { ReceiptData } from '@models';

export interface ReceiptScanResult {
  file: File;
  receiptData: ReceiptData;
  imagePreview: string;
}

@Component({
  selector: 'app-receipt-scanner',
  templateUrl: './receipt-scanner.component.html',
  styleUrl: './receipt-scanner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ReceiptScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() receiptScanned = new EventEmitter<ReceiptScanResult>();
  @Output() cancelled = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  
  cameraStream$: Observable<MediaStream | null>;
  ocrProgress$: Observable<OcrProgress>;
  
  isProcessing = false;
  cameraSupported = false;
  cameraActive = false;
  imagePreview: string | null = null;
  errorMessage: string | null = null;
  processingStep = '';

  constructor(
    private receiptScanner: ReceiptScannerService,
    private ocrService: OcrService,
    private cdr: ChangeDetectorRef
  ) {
    this.cameraStream$ = this.receiptScanner.stream$;
    this.ocrProgress$ = this.ocrService.progress$;
  }

  async ngOnInit(): Promise<void> {
    this.cameraSupported = await this.receiptScanner.checkCameraSupport();
    this.cdr.detectChanges();

    // Subscribe to camera stream
    this.cameraStream$.pipe(takeUntil(this.destroy$)).subscribe(stream => {
      if (stream && this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.cameraActive = true;
      } else {
        this.cameraActive = false;
      }
      this.cdr.detectChanges();
    });

    // Subscribe to OCR progress
    this.ocrProgress$.pipe(takeUntil(this.destroy$)).subscribe(progress => {
      this.processingStep = progress.status;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
    this.ocrService.cleanup();
  }

  async startCamera(): Promise<void> {
    try {
      this.errorMessage = null;
      await this.receiptScanner.startCamera({ facingMode: 'environment' });
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Camera access failed';
      this.cdr.detectChanges();
    }
  }

  stopCamera(): void {
    this.receiptScanner.stopCamera();
    this.imagePreview = null;
    this.cdr.detectChanges();
  }

  async capturePhoto(): Promise<void> {
    if (!this.videoElement?.nativeElement) return;

    try {
      this.errorMessage = null;
      const file = await this.receiptScanner.capturePhoto(this.videoElement.nativeElement);
      await this.processReceiptFile(file);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.processFile(file);
    }
  }

  async processFile(file: File): Promise<void> {
    try {
      this.receiptScanner.validateImageFile(file);
      await this.processReceiptFile(file);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Invalid file';
      this.cdr.detectChanges();
    }
  }

  private async processReceiptFile(file: File): Promise<void> {
    this.isProcessing = true;
    this.errorMessage = null;
    this.stopCamera();
    this.cdr.detectChanges();

    try {
      // Create image preview
      this.receiptScanner.createImagePreview(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe((preview: string) => {
          this.imagePreview = preview;
          this.cdr.detectChanges();
        });

      // Process with OCR
      const receiptData = await this.ocrService.processReceipt(file).pipe(
        finalize(() => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$)
      ).toPromise();

      if (receiptData && this.imagePreview) {
        const result: ReceiptScanResult = {
          file,
          receiptData,
          imagePreview: this.imagePreview
        };
        this.receiptScanned.emit(result);
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'OCR processing failed';
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  retakePhoto(): void {
    this.imagePreview = null;
    this.startCamera();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  getProcessingMessage(): string {
    switch (this.processingStep) {
      case 'initializing':
        return 'Initializing OCR engine...';
      case 'processing':
        return 'Reading receipt text...';
      case 'completed':
        return 'Processing complete!';
      case 'error':
        return 'Error processing receipt';
      default:
        return 'Processing receipt...';
    }
  }
}
