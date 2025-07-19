import { ChangeDetectionStrategy, Component, Inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { InventoryCreateFacade, InventoryCreateFacadeModel, initialState } from "./inventory-create.facade";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { tap, Observable, of } from "rxjs";
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
  showCloseButton: boolean = false;

  constructor(
    private facade: InventoryCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<InventoryCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.showCloseButton = data?.showCloseButton || false;
    this.inventoryForm = this.formBuilder.group({
      barCode: new FormControl<string | null>(null),
      itemName: new FormControl<string | null>(null),
      price: new FormControl<string | null>(null),
      store: new FormControl<string | null>(null),
    });
    this.barCodeControl.setValue("");
    this.nameControl.setValue("");
    this.vm$ = this.facade.vm$.pipe(
      tap((vm) => {
        this.storeControl.setValue(vm.selectedStore);
        console.log(vm.selectedStore, 'Selected Store in Inventory Create Component');
        
      })
    );
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
      const inventoryData: Partial<Inventory> = {
        userId: vm.userId,
        name: this.nameControl.value,
        barCode: this.barCodeControl.value,
        price: this.priceControl.value,
        store: this.storeControl.value,
      };
      
      await this.facade.addInventoryItem(inventoryData);
      this.matDialogRef.close();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
    }
  }

  async onBarcodeScanned(barcode: string): Promise<void> {
    this.barCodeControl.setValue(barcode);
    await this.facade.onBarcodeScanned(barcode);
    this.closeDialog();
  }

  onBarcodeScanError(error: string): void {
    console.error('Barcode scan error:', error);
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}