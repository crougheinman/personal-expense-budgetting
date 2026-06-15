import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AsyncPipe, CommonModule } from "@angular/common";

import { SidebarComponent } from "./custom/sidebar/sidebar.component";
import { ExpensesCreateComponent } from "./expenses-create/expenses-create.component";
import { ExpensesListComponent } from "./expenses-list/expenses-list.component";
import { ExpensesEditComponent } from './expenses-edit/expenses-edit.component';
import { ExpensesDetailComponent } from './expenses-detail/expenses-detail.component';
import { BillingCreateComponent } from "./billing-create/billing-create.component";
import { BillingListComponent } from "./billing-list/billing-list.component";
import { BillingEditComponent } from "./billing-edit/billing-edit.component";
import { BillingDetailComponent } from "./billing-detail/billing-detail.component";
import { BillingPayDialogComponent } from "./billing-pay-dialog/billing-pay-dialog.component";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";

import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CameraComponent } from "./camera/camera.component";
import { ProductScanner } from './product-scanner/product-scanner';
import { InventoryCreateComponent } from "./inventory-create/inventory-create.component";
import { InventoryListComponent } from "./inventory-list/inventory-list.component";
import { InventoryEditComponent } from "./inventory-edit/inventory-edit.component";
import { VoiceExpenseComponent } from "./voice-expense/voice-expense.component";
import { ReceiptScannerComponent } from "./receipt-scanner/receipt-scanner.component";
import { ReceiptScanStripComponent } from "./receipt-scan-strip/receipt-scan-strip.component";
import { SwipeToDeleteDirective } from "./shared/swipe-to-delete.directive";
import { TimePickerComponent } from "./shared/time-picker/time-picker.component";
import { DatePickerComponent } from "./shared/date-picker/date-picker.component";
import { MaterialModule } from "../shared/material.module";

@NgModule({
  declarations: [
    ExpensesCreateComponent,
    ExpensesListComponent,
    SidebarComponent,
    ExpensesEditComponent,
    ExpensesDetailComponent,
    BillingCreateComponent,
    BillingListComponent,
    BillingEditComponent,
    BillingDetailComponent,
    BillingPayDialogComponent,
    ConfirmationDialogComponent,
    InventoryCreateComponent,
    InventoryListComponent,
    InventoryEditComponent,
    CameraComponent,
    ProductScanner,
    VoiceExpenseComponent,
    ReceiptScannerComponent,
    ReceiptScanStripComponent,
    SwipeToDeleteDirective,
    TimePickerComponent,
    DatePickerComponent,
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
    ExpensesDetailComponent,
    ExpensesListComponent,
    BillingCreateComponent,
    BillingListComponent,
    BillingEditComponent,
    BillingDetailComponent,
    ConfirmationDialogComponent,
    InventoryCreateComponent,
    InventoryListComponent,
    InventoryEditComponent,
    SidebarComponent,
    ReceiptScanStripComponent,
    SwipeToDeleteDirective,
    TimePickerComponent,
    DatePickerComponent,
    AsyncPipe,
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComponentsModule {}
