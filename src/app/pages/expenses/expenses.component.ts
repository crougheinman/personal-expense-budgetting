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
            data: { message : 'add expenses'},
            title: 'Some invites have not been sent!',
            panelClass: 'tt9-modal',
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
        })
  }
}


