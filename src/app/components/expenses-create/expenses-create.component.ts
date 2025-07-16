import { ChangeDetectionStrategy, Component, Input, OnDestroy } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { ExpensesCreateFacade, ExpensesCreateFacadeModel, initialState } from "./expenses-create.facade";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import moment from "moment";
import { Timestamp } from "firebase/firestore";
import { CameraError, CameraPhoto } from "../camera/camera.component";

@Component({
  selector: "app-expenses-create.component",
  templateUrl: "./expenses-create.component.html",
  styleUrl: "./expenses-create.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesCreateFacade],
})
export class ExpensesCreateComponent implements OnDestroy {
  expensesForm!: FormGroup;
  vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);
  private ocrWorker: any = null;
  isProcessingOCR = false;

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
  ) {
    this.vm$ = this.facade.vm$;
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null),
      expenseAmount: new FormControl<string | null>(null),
    });
    this.nameControl.setValue("");
    this.amountControl.setValue("");
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  async addExpenses(vm: ExpensesCreateFacadeModel): Promise<void> {
    await this.facade.addExpense({
      userId: vm.userId,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      expenseDate: Timestamp.fromDate(moment().toDate()),
    });
    
    this.matDialogRef.close();
  }

  openCamera(): void {
    this.facade.openCamera();
  }

  closeCamera(): void {
    this.facade.closeCamera();
  }

  onPhotoTaken(event: CameraPhoto): void {
    console.log('Photo captured:', event);
    this.processPhoto(event.file);
    this.closeCamera();
  }

  onCameraError(): void {
    console.error('Camera error occurred');
    // Handle camera errors
    alert(`Camera Error: An error occurred while accessing the camera. Please try again later.`);
  }

  onCameraStarted(): void {
    console.log('Camera started successfully');
  }

  onCameraStopped(): void {
    console.log('Camera stopped');
    this.closeCamera();
  }

  private async processPhoto(file: File): Promise<void> {
    try {
      this.isProcessingOCR = true;
      console.log('Processing image with OCR...');

      // Dynamic import to avoid SSR issues with __dirname
      const { createWorker } = await import('tesseract.js');
      
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker('eng', 1, {
          logger: m => console.log(m),
          corePath: 'https://unpkg.com/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
          workerPath: 'https://unpkg.com/tesseract.js@v5.0.0/dist/worker.min.js',
        });
      }

      const { data: { text } } = await this.ocrWorker.recognize(file);
      console.log("OCR Result:", text);

      this.extractExpenseData(text);
    } catch (error) {
      console.error('OCR processing failed:', error);
      alert('Failed to process image. Please enter expense details manually.');
    } finally {
      this.isProcessingOCR = false;
    }
  }

  private extractExpenseData(ocrText: string): void {
    // Clean the text
    const cleanText = ocrText.replace(/[^\w\s\$\.\,\-]/g, '').trim();
    
    // Extract amount patterns
    const amountPatterns = [
      /total:?\s*\$?(\d+\.?\d*)/i,
      /amount:?\s*\$?(\d+\.?\d*)/i,
      /\$(\d+\.?\d*)/,
      /(\d+\.\d{2})/
    ];

    let extractedAmount = '';
    for (const pattern of amountPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        extractedAmount = match[1];
        break;
      }
    }

    if (extractedAmount) {
      this.amountControl.setValue(extractedAmount);
    }

    // Extract merchant name (first meaningful line)
    const lines = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2 && line.length < 50);
    
    if (lines.length > 0) {
      // Skip lines that are just numbers or amounts
      const merchantLine = lines.find(line => !/^\$?\d+\.?\d*$/.test(line));
      if (merchantLine) {
        this.nameControl.setValue(merchantLine);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.ocrWorker) {
      this.ocrWorker.terminate();
    }
  }
}
