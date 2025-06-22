import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { ExpensesCreateComponent } from '@app/components';

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
    console.log('opened');
    
    this.dialogService.open(ExpensesCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
        })
  }
}


