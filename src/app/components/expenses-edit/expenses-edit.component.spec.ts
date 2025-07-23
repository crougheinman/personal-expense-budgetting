import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { ExpensesEditComponent } from './expenses-edit.component';
import { ExpensesEditFacade } from './expenses-edit.facade';

describe('ExpensesEditComponent', () => {
  let component: ExpensesEditComponent;
  let fixture: ComponentFixture<ExpensesEditComponent>;

  const mockInputData = {
    id: 'test-expense-id',
    name: 'Test Expense',
    amount: '25.99',
    description: 'Test Description',
    category: 'food',
    expenseDate: new Date('2024-01-01')
  };

  beforeEach(async () => {
    const mockFacade = {
      editExpense: jasmine.createSpy('editExpense'),
      deleteExpense: jasmine.createSpy('deleteExpense')
    };

    const mockMatBottomSheetRef = {
      dismiss: jasmine.createSpy('dismiss')
    };

    await TestBed.configureTestingModule({
      declarations: [ExpensesEditComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ExpensesEditFacade, useValue: mockFacade },
        { provide: MatBottomSheetRef, useValue: mockMatBottomSheetRef },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: mockInputData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to form controls', () => {
    expect(component.nameControl).toBeDefined();
    expect(component.amountControl).toBeDefined();
    expect(component.descriptionControl).toBeDefined();
    expect(component.categoryControl).toBeDefined();
    expect(component.expenseDateControl).toBeDefined();
  });
});