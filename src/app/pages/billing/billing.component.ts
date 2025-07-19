import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogService } from '@services';
import { BillingCreateComponent } from '@app/components';

@Component({
  selector: 'pages-billing',
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class BillingComponent {
  constructor(private dialogService: DialogService) {}

  openAddBillingDialog(): void {
    this.dialogService.open(BillingCreateComponent, {
            width: '444px',
            closeButtonTxt: 'OK',
            confirmBtn: false,
            mobileFullscreen: true,
            showCloseButton: true,
        })
  }
}


