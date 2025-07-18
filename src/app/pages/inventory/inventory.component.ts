import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { InventoryCreateComponent } from '@app/components';

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
    this.dialogService.open(InventoryCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
            mobileFullscreen: true,
            showCloseButton: true,
        })
  }
}


