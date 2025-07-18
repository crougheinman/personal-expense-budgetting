import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { InventoryCreateFacade, InventoryCreateFacadeModel, initialState } from "./inventory-create.facade";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import moment from "moment";
import { Timestamp } from "firebase/firestore";

@Component({
  selector: "app-inventory-create",
  templateUrl: "./inventory-create.component.html",
  styleUrl: "./inventory-create.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InventoryCreateFacade],
})
export class InventoryCreateComponent {
  inventoryForm!: FormGroup;
  vm$: Observable<InventoryCreateFacadeModel> = of(initialState);
  capturedImageUrl: string | null = null;

  constructor(
    private facade: InventoryCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<InventoryCreateComponent>,
  ) {
    this.vm$ = this.facade.vm$;
    this.inventoryForm = this.formBuilder.group({
      itemName: new FormControl<string | null>(null),
      itemQuantity: new FormControl<number | null>(null),
      itemPrice: new FormControl<number | null>(null),
      itemDescription: new FormControl<string | null>(null),
    });
    this.nameControl.setValue("");
    this.quantityControl.setValue("");
    this.priceControl.setValue("");
    this.descriptionControl.setValue("");
  }

  get nameControl(): AbstractControl {
    return this.inventoryForm.get("itemName") as AbstractControl;
  }

  get quantityControl(): AbstractControl {
    return this.inventoryForm.get("itemQuantity") as AbstractControl;
  }

  get priceControl(): AbstractControl {
    return this.inventoryForm.get("itemPrice") as AbstractControl;
  }

  get descriptionControl(): AbstractControl {
    return this.inventoryForm.get("itemDescription") as AbstractControl;
  }

  async addInventoryItem(vm: InventoryCreateFacadeModel): Promise<void> {
    await this.facade.addInventoryItem({
      userId: vm.userId,
      name: this.nameControl.value,
      amount: this.priceControl.value,
      expenseDate: Timestamp.fromDate(moment().toDate()),
      // Store additional inventory info in the name field for now
      // Format: "ItemName (Qty: X, Desc: Y)"
    });
    this.matDialogRef.close();
  }

  onBarcodeScanned(barcode: string): void {
    // Handle the scanned barcode - populate the item name field
    this.nameControl.setValue(barcode);
  }

  onBarcodeScanError(error: string): void {
    console.error('Barcode scan error:', error);
    // Optionally show user-friendly error message
  }
}