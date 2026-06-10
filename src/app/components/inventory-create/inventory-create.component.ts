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
import { GeminiScanResult } from "@services";

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
      itemName: new FormControl<string | null>(null),
      price: new FormControl<string | null>(null),
      store: new FormControl<string | null>(null),
    });
    this.nameControl.setValue("");
    this.vm$ = this.facade.vm$.pipe(
      tap((vm) => {
        this.storeControl.setValue(vm.selectedStore);
        console.log(vm.selectedStore, 'Selected Store in Inventory Create Component');
        
      })
    );
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
        price: this.priceControl.value,
        store: this.storeControl.value,
      };
      
      await this.facade.addInventoryItem(inventoryData);
      this.matDialogRef.close();
    } catch (error) {
      console.error('Failed to add inventory item:', error);
    }
  }

  // Auto-fill the form from the product Gemini identified in the photo.
  onItemDetected(item: GeminiScanResult): void {
    if (item.name) {
      this.nameControl.setValue(item.name);
    }
    if (item.price != null) {
      this.priceControl.setValue(item.price);
    }
  }

  onScanError(error: string): void {
    console.error('Product scan error:', error);
  }

  closeDialog(): void {
    this.matDialogRef.close();
  }
}