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
import { Inventory } from "@app/models";

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
      barCode: new FormControl<string | null>(null),
      itemName: new FormControl<string | null>(null),
      price: new FormControl<string | null>(null),
      store: new FormControl<string | null>(null),
    });
    this.barCodeControl.setValue("");
    this.nameControl.setValue("");
    this.priceControl.setValue("");
    this.storeControl.setValue("");
  }

  get barCodeControl(): AbstractControl {
    return this.inventoryForm.get("barCode") as AbstractControl;
  }

  get nameControl(): AbstractControl {
    return this.inventoryForm.get("itemName") as AbstractControl;
  }

  get priceControl(): AbstractControl {
    return this.inventoryForm.get("price") as AbstractControl;
  }

  get storeControl(): AbstractControl {
    return this.inventoryForm.get("store") as AbstractControl;
  }

  async addInventoryItem(vm: InventoryCreateFacadeModel): Promise<void> {
    try {
      // Combine inventory data into a structured description
      const inventoryData: Partial<Inventory> = {
        barCode: this.barCodeControl.value,
        price: this.priceControl.value,
        store: this.storeControl.value,
      };
      
      await this.facade.addInventoryItem(inventoryData);
      this.matDialogRef.close();
    } catch (error) {
      // Error is already handled in the facade with snackbar
      // Dialog remains open so user can retry
      console.error('Failed to add inventory item:', error);
    }
  }

  onBarcodeScanned(barcode: string): void {
    // Handle the scanned barcode - populate both barcode fields
    this.barCodeControl.setValue(barcode);
  }

  onBarcodeScanError(error: string): void {
    console.error('Barcode scan error:', error);
    // Optionally show user-friendly error message
  }
}