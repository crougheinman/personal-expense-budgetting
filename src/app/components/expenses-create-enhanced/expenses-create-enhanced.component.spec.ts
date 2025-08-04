import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';

import { ExpensesCreateEnhancedComponent } from './expenses-create-enhanced.component';
import { ExpensesCreateEnhancedFacade } from './expenses-create-enhanced.facade';

describe('ExpensesCreateEnhancedComponent', () => {
  let component: ExpensesCreateEnhancedComponent;
  let fixture: ComponentFixture<ExpensesCreateEnhancedComponent>;

  beforeEach(async () => {
    const mockFacade = {
      vm$: of({
        userId: 'test-user-id',
        isAddingExpense: false,
        addExpenseSuccess: false,
        addExpenseError: null
      }),
      addExpense: jasmine.createSpy('addExpense')
    };

    const mockMatDialogRef = {
      close: jasmine.createSpy('close')
    };

    const mockChangeDetectorRef = {
      detectChanges: jasmine.createSpy('detectChanges')
    };

    await TestBed.configureTestingModule({
      declarations: [ExpensesCreateEnhancedComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ExpensesCreateEnhancedFacade, useValue: mockFacade },
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesCreateEnhancedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.expensesForm).toBeDefined();
    expect(component.nameControl).toBeDefined();
    expect(component.amountControl).toBeDefined();
  });
});