import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import { AbstractControl, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { InventoryEditFacade } from "./inventory-edit.facade";
import { Inventory } from "@app/models";

interface InputData {
  id?: string;
  name?: string;
  price?: string;
  description?: string;
  store?: string;
}

@Component({
  selector: "component-inventory-edit",
  standalone: false,
  templateUrl: "./inventory-edit.component.html",
  styleUrl: "./inventory-edit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InventoryEditFacade]
})
export class InventoryEditComponent {
  inventoryForm!: FormGroup;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: InputData,
    private facade: InventoryEditFacade,
    private formBuilder: FormBuilder,
    private matBottomSheetRef: MatBottomSheetRef<InventoryEditComponent>
  ) {
    const { name, price, description, store } = data
    this.inventoryForm = this.formBuilder.group({
      inventoryName: new FormControl<string | null>(null),
      inventoryPrice: new FormControl<string | null>(null),
      inventoryDescription: new FormControl<string | null>(null),
      inventoryStore: new FormControl<string | null>(null),
    });
    this.nameControl.setValue(name);
    this.priceControl.setValue(price);
    this.descriptionControl.setValue(description);
    this.storeControl.setValue(store);
  }

  get nameControl(): AbstractControl {
    return this.inventoryForm.get("inventoryName") as AbstractControl;
  }

  get priceControl(): AbstractControl {
    return this.inventoryForm.get("inventoryPrice") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.inventoryForm.get("inventoryDescription") as AbstractControl;
  }

  get storeControl(): AbstractControl {
    return this.inventoryForm.get("inventoryStore") as AbstractControl;
  }

  async updateInventory(): Promise<void> {
    this.facade.editInventoryItem({
      id: this.data.id,
      name: this.nameControl.value,
      price: this.priceControl.value,
      description: this.descriptionControl.value,
      store: this.storeControl.value,
    })

    this.matBottomSheetRef.dismiss();
  }

  async deleteInventory(): Promise<void> {
    this.facade.deleteInventoryItem(this.data as Partial<Inventory>);

    this.matBottomSheetRef.dismiss();
  }
}
