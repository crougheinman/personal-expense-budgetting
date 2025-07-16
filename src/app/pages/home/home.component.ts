import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
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
    private dialog: MatDialog
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
    this.dialog.open(ExpensesCreateComponent, {
      width: '500px',
      maxWidth: '90vw'
    });
  }

  viewAnalytics(): void {
    // For now, navigate to expenses - analytics can be added later
    this.router.navigate(['/expenses/list']);
  }
}
