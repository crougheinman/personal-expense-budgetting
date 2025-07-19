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
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  canManualFocus = false;

  ngAfterViewInit(): void {
    // Component is ready for scanning
  }

  startScan(): void {
    if (this.scanning) return;
    
    this.scanning = true;
    this.isScanning = true;
    this.scanStarted.emit();
    
    // Request camera with autofocus capabilities
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment',
        advanced: [
          { focusMode: 'continuous' } as any,
          { torch: false } as any
        ]
      } as any
    }).then((stream) => {
      this.stream = stream;
      this.videoElement = document.getElementById('barcodeVideoElement') as HTMLVideoElement;
      
      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        
        // Enable autofocus capabilities
        this.setupCameraControls(stream);
        
        // Start the barcode decoder
        this.codeReader.decodeFromVideoDevice(null, 'barcodeVideoElement', (result: Result | undefined, err) => {
          if (result) {
            this.barcodeResult = result.getText();
            this.scanned.emit(this.barcodeResult);
            this.stopScan();
          } else if (err) {
            if (err.name !== 'NotFoundException') {
              console.error('Barcode scan error:', err);
              this.error.emit('Scanner error: ' + err.message);
            }
          }
        });
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
    
    // Stop video stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.scanning = false;
    this.isScanning = false;
    this.scanStopped.emit();
  }

  private setupCameraControls(stream: MediaStream): void {
    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack) {
      // Get camera capabilities
      const capabilities = videoTrack.getCapabilities() as any;
      
      // Check if manual focus is supported
      this.canManualFocus = capabilities.focusMode && 
        (capabilities.focusMode.includes('single-shot') || capabilities.focusMode.includes('manual'));
      
      // Set up autofocus if supported
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous-video')) {
        videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous-video' } as any]
        }).catch(err => console.log('Could not apply focus constraints:', err));
      }
      
      // Enable tap-to-focus on video element
      if (this.videoElement) {
        this.videoElement.addEventListener('click', (event) => {
          this.handleTapToFocus(event, videoTrack);
        });
      }
    }
  }

  private handleTapToFocus(event: MouseEvent, videoTrack: MediaStreamTrack): void {
    if (!this.videoElement) return;
    
    const rect = this.videoElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Show focus indicator
    this.showFocusIndicator(event.clientX - rect.left, event.clientY - rect.top);
    
    // Apply focus at the tapped point if supported
    const capabilities = videoTrack.getCapabilities() as any;
    if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
      videoTrack.applyConstraints({
        advanced: [{
          focusMode: 'single-shot',
          pointsOfInterest: [{ x, y }]
        } as any]
      }).catch(err => console.log('Could not apply tap-to-focus:', err));
    }
  }

  private showFocusIndicator(x: number, y: number): void {
    const focusIndicator = document.getElementById('focusIndicator');
    if (focusIndicator) {
      // Position the indicator
      focusIndicator.style.left = `${x}px`;
      focusIndicator.style.top = `${y}px`;
      
      // Show animation
      focusIndicator.classList.remove('fade-out');
      focusIndicator.classList.add('active');
      
      // Hide after animation
      setTimeout(() => {
        focusIndicator.classList.remove('active');
        focusIndicator.classList.add('fade-out');
        
        setTimeout(() => {
          focusIndicator.classList.remove('fade-out');
        }, 300);
      }, 1000);
    }
  }

  triggerFocus(): void {
    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
          videoTrack.applyConstraints({
            advanced: [{ focusMode: 'single-shot' } as any]
          }).catch(err => console.log('Could not trigger focus:', err));
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
}
