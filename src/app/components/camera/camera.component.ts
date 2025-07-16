import { 
  Component, 
  ElementRef, 
  ViewChild, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input
} from '@angular/core';
import { Subject } from 'rxjs';

export interface CameraPhoto {
  file: File;
  dataUrl: string;
  timestamp: Date;
}

export interface CameraError {
  type: 'permission' | 'not-supported' | 'stream-error' | 'capture-error';
  message: string;
}

@Component({
  selector: 'component-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class CameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() autoStart = false;
  @Input() width = 640;
  @Input() height = 480;
  @Input() facingMode: 'user' | 'environment' = 'environment'; // 'user' for front camera, 'environment' for back camera
  @Input() quality = 0.8; // JPEG quality (0.0 to 1.0)

  @Output() photoTaken = new EventEmitter<CameraPhoto>();
  @Output() cameraError = new EventEmitter<CameraError>();
  @Output() cameraStarted = new EventEmitter<void>();
  @Output() cameraStopped = new EventEmitter<void>();
  @Output() cameraSwitched = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private stream: MediaStream | null = null;

  cameraSupported = false;
  cameraActive = false;
  isCapturing = false;
  hasPermission = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.checkCameraSupport();
    
    if (this.autoStart && this.cameraSupported) {
      await this.startCamera();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  private checkCameraSupport(): void {
    this.cameraSupported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    );
    this.cdr.detectChanges();
  }

  async startCamera(): Promise<void> {
    if (!this.cameraSupported) {
      this.emitError('not-supported', 'Camera is not supported on this device');
      return;
    }

    try {
      // Request camera permissions
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.width },
          height: { ideal: this.height },
          facingMode: { ideal: this.facingMode }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.hasPermission = true;
      this.cameraActive = true;

      // Wait for video element to be available
      setTimeout(() => {
        if (this.videoElement?.nativeElement && this.stream) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;
          
          video.onloadedmetadata = () => {
            video.play().then(() => {
              this.cameraStarted.emit();
              this.cdr.detectChanges();
            }).catch(error => {
              this.emitError('stream-error', `Failed to start video playback: ${error.message}`);
            });
          };
        }
      }, 100);

    } catch (error) {
      this.handleCameraError(error);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }

    this.cameraActive = false;
    this.cameraStopped.emit();
    this.cdr.detectChanges();
  }

  async capturePhoto(): Promise<void> {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      this.emitError('capture-error', 'Camera elements not ready');
      return;
    }

    if (!this.cameraActive || !this.stream) {
      this.emitError('capture-error', 'Camera is not active');
      return;
    }

    try {
      this.isCapturing = true;
      this.cdr.detectChanges();

      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || this.width;
      canvas.height = video.videoHeight || this.height;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const dataUrl = canvas.toDataURL('image/jpeg', this.quality);
      
      // Convert data URL to file
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const photo: CameraPhoto = {
        file,
        dataUrl,
        timestamp: new Date()
      };

      this.photoTaken.emit(photo);

    } catch (error) {
      this.emitError('capture-error', error instanceof Error ? error.message : 'Failed to capture photo');
    } finally {
      this.isCapturing = false;
      this.cdr.detectChanges();
    }
  }

  async switchCamera(): Promise<void> {
    const newFacingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.facingMode = newFacingMode;
    
    if (this.cameraActive) {
      this.stopCamera();
      await this.startCamera();
    }
    this.cameraSwitched.emit();
  }

  private handleCameraError(error: any): void {
    console.error('Camera error:', error);
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      this.emitError('permission', 'Camera permission denied. Please allow camera access and try again.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      this.emitError('not-supported', 'No camera found on this device.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      this.emitError('stream-error', 'Camera is already in use by another application.');
    } else {
      this.emitError('stream-error', error.message || 'Failed to access camera');
    }
  }

  private emitError(type: CameraError['type'], message: string): void {
    this.cameraError.emit({ type, message });
    this.cameraActive = false;
    this.cdr.detectChanges();
  }
}