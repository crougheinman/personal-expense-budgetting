import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '@services';
import { HomeFacade, HomeFacadeModel } from './home.facade';
import { Observable, of } from 'rxjs';
import { ExpensesCreateComponent } from '@components';

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
    // For now, navigate to expenses - bills functionality can be added later
    this.router.navigate(['/expenses/list']);
  }

  createNewExpense(): void {
    this.dialogService.open(ExpensesCreateComponent, {
      width: '500px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  viewAnalytics(): void {
    // For now, navigate to expenses - analytics can be added later
    this.router.navigate(['/expenses/list']);
  }
}
