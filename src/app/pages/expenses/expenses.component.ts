import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { ExpensesCreateComponent, VoiceExpenseComponent } from '@app/components';

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
    this.dialogService.open(ExpensesCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
            mobileFullscreen: true,
            showCloseButton: true,
        })
  }

  openVoiceExpenseDialog(): void {
    this.dialogService.open(VoiceExpenseComponent, {
      width: '420px',
      mobileFullscreen: false,
      showCloseButton: true,
    });
  }
}


