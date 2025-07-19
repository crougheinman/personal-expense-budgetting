import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  BillingListFacade,
  BillingListFacadeModel,
  initialState,
} from "./billing-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { 
  Billing
} from "@app/models";
import { BillingEditComponent } from "../billing-edit/billing-edit.component";

@Component({
  selector: "component-billing-list",
  templateUrl: "./billing-list.component.html",
  styleUrl: "./billing-list.component.scss",
  providers: [BillingListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingListComponent {
  vm$: Observable<BillingListFacadeModel> = of(initialState);

  constructor(
    private facade: BillingListFacade,
    private bottomSheet: MatBottomSheet
  ) {
    this.vm$ = this.facade.vm$;
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  onItemClick(billingItem: Billing): void {
    this.bottomSheet.open(BillingEditComponent, {
      data: {
        ...billingItem,
      },
    });
  }
}
