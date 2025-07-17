import { Component, EventEmitter, Output, OnDestroy, AfterViewInit } from '@angular/core';
import { BrowserMultiFormatReader, Result } from '@zxing/library';

@Component({
  selector: 'app-barcode-scanner',
  standalone: false,
  templateUrl: './barcode-scanner.html',
  styleUrl: './barcode-scanner.scss'
})
export class BarcodeScanner implements AfterViewInit, OnDestroy {
  @Output() scanned = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();
  @Output() scanStarted = new EventEmitter<void>();
  @Output() scanStopped = new EventEmitter<void>();

  barcodeResult: string | null = null;
  private codeReader = new BrowserMultiFormatReader();
  private scanning = false;
  isScanning = false;

  ngAfterViewInit(): void {
    // Component is ready for scanning
  }

  startScan(): void {
    if (this.scanning) return;
    
    this.scanning = true;
    this.isScanning = true;
    this.scanStarted.emit();
    
    this.codeReader.decodeFromVideoDevice(null, 'barcodeVideoElement', (result: Result | undefined, err) => {
      if (result) {
        this.barcodeResult = result.getText();
        this.scanned.emit(this.barcodeResult);
        this.stopScan();
      } else if (err) {
        // Only log critical errors, not "no barcode found" errors
        if (err.name !== 'NotFoundException') {
          console.error('Barcode scan error:', err);
          this.error.emit('Scanner error: ' + err.message);
        }
        // NotFoundException is normal - it just means no barcode was detected in this frame
        // The scanner will continue trying automatically
      }
    }).catch((err) => {
      console.error('Camera access error:', err);
      this.error.emit('Camera access denied or not available');
      this.scanning = false;
      this.isScanning = false;
    });
  }

  stopScan(): void {
    this.codeReader.reset();
    this.scanning = false;
    this.isScanning = false;
    this.scanStopped.emit();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
}
