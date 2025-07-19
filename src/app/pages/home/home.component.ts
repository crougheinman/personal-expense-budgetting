import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '@services';
import { HomeFacade, HomeFacadeModel } from './home.facade';
import { Observable, of } from 'rxjs';
import { BillingCreateComponent, ExpensesCreateComponent, InventoryCreateComponent } from '@components';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeFacade],
})
export class Home {
  vm$: Observable<HomeFacadeModel> = of({});
  
  constructor(
    private facade: HomeFacade,
    private router: Router,
    private dialogService: DialogService
  ) { 
    this.vm$ = this.facade.vm$;
  }

  navigateToExpenses(): void {
    this.router.navigate(['/expenses/list']);
  }

  navigateToBills(): void {
    this.router.navigate(['/billing/list']);
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory/list']);
  }

  createNewExpense(): void {
    this.dialogService.open(ExpensesCreateComponent, {
      width: '500px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  createNewItem(): void {
    this.dialogService.open(InventoryCreateComponent, {
      width: '444px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  createNewBill(): void {
    this.dialogService.open(BillingCreateComponent, {
      width: '500px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  viewAnalytics(): void {
    this.router.navigate(['/dashboard']);
  }
}
