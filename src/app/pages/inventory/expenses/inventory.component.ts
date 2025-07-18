import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { ExpensesCreateComponent } from '@app/components';

@Component({
  selector: 'pages-inventory',
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class InventoryComponent {
  constructor(private dialogService: DialogService) {}

  openAddInventoryDialog(): void {
    this.dialogService.open(ExpensesCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
        })
  }
}


