import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, BehaviorSubject } from 'rxjs';

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptScannerService {
  private streamSubject = new BehaviorSubject<MediaStream | null>(null);
  public stream$ = this.streamSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async startCamera(constraints: CameraConstraints = {}): Promise<MediaStream> {
    if (!this.isBrowser) {
      throw new Error('Camera access is only available in browser environment');
    }

    try {
      const defaultConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: constraints.facingMode || 'environment', // Back camera for receipt scanning
          ...constraints
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      this.streamSubject.next(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Unable to access camera. Please check permissions.');
    }
  }

  async capturePhoto(videoElement: HTMLVideoElement): Promise<File> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw video frame to canvas
    context.drawImage(videoElement, 0, 0);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to capture image'));
          return;
        }

        // Create file from blob
        const file = new File([blob], `receipt-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        resolve(file);
      }, 'image/jpeg', 0.9);
    });
  }

  stopCamera(): void {
    const currentStream = this.streamSubject.value;
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      this.streamSubject.next(null);
    }
  }

  async checkCameraSupport(): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.isBrowser) {
      return [];
    }
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please select a JPEG, PNG, or WebP image.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Please select an image smaller than 10MB.');
    }

    return true;
  }

  createImagePreview(file: File): Observable<string> {
    return from(new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    }));
  }
}
