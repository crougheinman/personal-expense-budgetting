import { 
  Component, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef 
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { ExpensesCreateEnhancedFacade, ExpensesCreateEnhancedFacadeModel, initialState } from "./expenses-create-enhanced.facade";
import { EXPENSE_CATEGORIES, getExpenseCategoryIcon, getCategoryDisplayName } from "@models";
import { ReceiptScanResult } from "../receipt-scanner/receipt-scanner.component";

@Component({
  selector: "app-expenses-create-enhanced",
  templateUrl: "./expenses-create-enhanced.component.html",
  styleUrl: "./expenses-create-enhanced.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesCreateEnhancedFacade],
  standalone: false
})
export class ExpensesCreateEnhancedComponent {
  expensesForm!: FormGroup;
  vm$: Observable<ExpensesCreateEnhancedFacadeModel> = of(initialState);
  categories = EXPENSE_CATEGORIES;
  
  showReceiptScanner = false;
  receiptData: ReceiptScanResult | null = null;

  constructor(
    private facade: ExpensesCreateEnhancedFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateEnhancedComponent>,
    private cdr: ChangeDetectorRef
  ) {
    this.vm$ = this.facade.vm$;
    this.initializeForm();
  }

  private initializeForm(): void {
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null, [Validators.required]),
      expenseAmount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      expenseDescription: new FormControl<string | null>(null),
      expenseCategory: new FormControl<string | null>('food'),
      expenseDate: new FormControl<Date | null>(new Date()),
      notes: new FormControl<string | null>(null)
    });
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.expensesForm.get("expenseDescription") as AbstractControl;
  }

  get categoryControl(): AbstractControl {
    return this.expensesForm.get("expenseCategory") as AbstractControl;
  }

  get dateControl(): AbstractControl {
    return this.expensesForm.get("expenseDate") as AbstractControl;
  }

  get notesControl(): AbstractControl {
    return this.expensesForm.get("notes") as AbstractControl;
  }

  openReceiptScanner(): void {
    this.showReceiptScanner = true;
    this.cdr.detectChanges();
  }

  closeReceiptScanner(): void {
    this.showReceiptScanner = false;
    this.cdr.detectChanges();
  }

  onReceiptScanned(result: ReceiptScanResult): void {
    this.receiptData = result;
    this.showReceiptScanner = false;

    // Auto-fill form with extracted data
    if (result.receiptData.extractedData) {
      const data = result.receiptData.extractedData;
      
      if (data.merchantName) {
        this.nameControl.setValue(data.merchantName);
      }
      
      if (data.total) {
        this.amountControl.setValue(data.total);
      }
      
      if (data.date) {
        this.dateControl.setValue(data.date);
      }

      // Set category based on merchant name (simple heuristic)
      const category = this.suggestCategory(data.merchantName || '');
      if (category) {
        this.categoryControl.setValue(category);
      }

      // Add original text to notes
      if (result.receiptData.originalText) {
        const extractedText = `Receipt OCR Text:\n${result.receiptData.originalText}`;
        this.notesControl.setValue(extractedText);
      }
    }

    this.cdr.detectChanges();
  }

  private suggestCategory(merchantName: string): string | null {
    const merchant = merchantName.toLowerCase();
    
    // Food and dining
    if (merchant.includes('restaurant') || merchant.includes('cafe') || 
        merchant.includes('bistro') || merchant.includes('diner') ||
        merchant.includes('pizza') || merchant.includes('burger') ||
        merchant.includes('food') || merchant.includes('kitchen')) {
      return 'food';
    }
    
    // Transportation
    if (merchant.includes('gas') || merchant.includes('fuel') ||
        merchant.includes('uber') || merchant.includes('taxi') ||
        merchant.includes('transport') || merchant.includes('parking')) {
      return 'transport';
    }
    
    // Shopping
    if (merchant.includes('store') || merchant.includes('mart') ||
        merchant.includes('shop') || merchant.includes('retail') ||
        merchant.includes('amazon') || merchant.includes('target')) {
      return 'shopping';
    }
    
    // Health
    if (merchant.includes('pharmacy') || merchant.includes('hospital') ||
        merchant.includes('clinic') || merchant.includes('dental') ||
        merchant.includes('medical') || merchant.includes('drug')) {
      return 'health';
    }
    
    // Entertainment
    if (merchant.includes('cinema') || merchant.includes('theater') ||
        merchant.includes('movie') || merchant.includes('game') ||
        merchant.includes('entertainment') || merchant.includes('bar')) {
      return 'entertainment';
    }
    
    return null;
  }

  clearReceiptData(): void {
    this.receiptData = null;
    this.cdr.detectChanges();
  }

  async addExpenses(vm: ExpensesCreateEnhancedFacadeModel): Promise<void> {
    if (!this.expensesForm.valid) {
      this.expensesForm.markAllAsTouched();
      return;
    }

    const expenseData = {
      userId: vm.userId,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      description: this.descriptionControl.value,
      category: this.categoryControl.value,
      expenseDate: this.dateControl.value,
      notes: this.notesControl.value,
      receiptData: this.receiptData?.receiptData
    };

    await this.facade.addExpense(expenseData);
    this.matDialogRef.close();
  }

  cancel(): void {
    this.matDialogRef.close();
  }

  getFormErrorMessage(controlName: string): string {
    const control = this.expensesForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName} is required`;
    }
    if (control?.hasError('min')) {
      return 'Amount must be greater than 0';
    }
    return '';
  }

  getExpenseCategoryIcon(category: string): string {
    return getExpenseCategoryIcon(category);
  }

  getCategoryDisplayName(category: string): string {
    return getCategoryDisplayName(category);
  }
}
