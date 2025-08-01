import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AsyncPipe, CommonModule } from "@angular/common";

import { SidebarComponent } from "./custom/sidebar/sidebar.component";
import { ExpensesCreateComponent } from "./expenses-create/expenses-create.component";
import { ExpensesListComponent } from "./expenses-list/expenses-list.component";
import { ExpensesEditComponent } from './expenses-edit/expenses-edit.component';
import { BillingCreateComponent } from "./billing-create/billing-create.component";
import { BillingListComponent } from "./billing-list/billing-list.component";
import { BillingEditComponent } from "./billing-edit/billing-edit.component";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";

import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CameraComponent } from "./camera/camera.component";
import { BarcodeScanner } from './barcode-scanner/barcode-scanner';
import { InventoryCreateComponent } from "./inventory-create/inventory-create.component";
import { InventoryListComponent } from "./inventory-list/inventory-list.component";
import { InventoryEditComponent } from "./inventory-edit/inventory-edit.component";
import { MaterialModule } from "../shared/material.module";

@NgModule({
  declarations: [
    ExpensesCreateComponent,
    ExpensesListComponent,
    SidebarComponent,
    ExpensesEditComponent,
    BillingCreateComponent,
    BillingListComponent,
    BillingEditComponent,
    ConfirmationDialogComponent,
    InventoryCreateComponent,
    InventoryListComponent,
    InventoryEditComponent,
    CameraComponent,
    BarcodeScanner,
  ],
  imports: [
    AsyncPipe,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
  ],
  exports: [
    ExpensesCreateComponent,
    ExpensesEditComponent,
    ExpensesListComponent,
    BillingCreateComponent,
    BillingListComponent,
    BillingEditComponent,
    ConfirmationDialogComponent,
    InventoryCreateComponent,
    InventoryListComponent,
    InventoryEditComponent,
    SidebarComponent,
    AsyncPipe,
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComponentsModule {}
