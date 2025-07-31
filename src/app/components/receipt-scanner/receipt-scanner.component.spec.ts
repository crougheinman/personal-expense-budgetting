import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

import { ReceiptScannerComponent } from './receipt-scanner.component';
import { ReceiptScannerService } from '../../services/receipt-scanner.service';
import { OcrService } from '../../services/ocr.service';

describe('ReceiptScannerComponent', () => {
  let component: ReceiptScannerComponent;
  let fixture: ComponentFixture<ReceiptScannerComponent>;

  beforeEach(async () => {
    const mockReceiptScannerService = {
      stream$: of(null),
      checkCameraSupport: jasmine.createSpy('checkCameraSupport').and.returnValue(Promise.resolve(true)),
      startCamera: jasmine.createSpy('startCamera'),
      stopCamera: jasmine.createSpy('stopCamera'),
      capturePhoto: jasmine.createSpy('capturePhoto'),
      validateImageFile: jasmine.createSpy('validateImageFile'),
      createImagePreview: jasmine.createSpy('createImagePreview').and.returnValue(of('test-preview'))
    };

    const mockOcrService = {
      progress$: of({ status: 'initializing' }),
      processReceipt: jasmine.createSpy('processReceipt'),
      cleanup: jasmine.createSpy('cleanup')
    };

    const mockChangeDetectorRef = {
      detectChanges: jasmine.createSpy('detectChanges')
    };

    await TestBed.configureTestingModule({
      declarations: [ReceiptScannerComponent],
      providers: [
        { provide: ReceiptScannerService, useValue: mockReceiptScannerService },
        { provide: OcrService, useValue: mockOcrService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptScannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component properties', () => {
    expect(component.isProcessing).toBeFalsy();
    expect(component.cameraSupported).toBeFalsy();
    expect(component.cameraActive).toBeFalsy();
    expect(component.imagePreview).toBeNull();
    expect(component.errorMessage).toBeNull();
    expect(component.processingStep).toBe('');
  });
});