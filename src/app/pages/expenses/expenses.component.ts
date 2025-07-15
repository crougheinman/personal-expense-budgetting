import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { ExpensesCreateEnhancedComponent } from '@app/components';

@Component({
  selector: 'pages-expenses',
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class ExpensesComponent {
  constructor(private dialogService: DialogService) {}

  openAddExpenseDialog(): void {
    this.dialogService.open(ExpensesCreateEnhancedComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            closeButtonTxt: 'Cancel',
            confirmBtn: false,
        })
  }
}


