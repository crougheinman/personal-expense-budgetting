import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  InventoryListFacade,
  InventoryListFacadeModel,
  initialState,
} from "./inventory-list.facade";
import { Observable, of } from "rxjs";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { 
  Inventory
} from "@app/models";
import { InventoryEditComponent } from "../inventory-edit/inventory-edit.component";

@Component({
  selector: "component-inventory-list",
  templateUrl: "./inventory-list.component.html",
  styleUrl: "./inventory-list.component.scss",
  providers: [InventoryListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  vm$: Observable<InventoryListFacadeModel> = of(initialState);

  constructor(
    private facade: InventoryListFacade,
    private bottomSheet: MatBottomSheet
  ) {
    this.vm$ = this.facade.vm$;
  }

  onSearch(ev: Event): void {
    const target = ev.target as HTMLTextAreaElement;
    this.facade.updateSearchKey(target.value);
  }

  onItemClick(inventoryItem: Inventory): void {
    this.bottomSheet.open(InventoryEditComponent, {
      data: {
        ...inventoryItem,
      },
    });
  }
}
