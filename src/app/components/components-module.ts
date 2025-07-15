import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { AsyncPipe, CommonModule } from "@angular/common";

import { SidebarComponent } from "./custom/sidebar/sidebar.component";
import { ExpensesCreateComponent } from "./expenses-create/expenses-create.component";
import { ExpensesListComponent } from "./expenses-list/expenses-list.component";
import { ExpensesEditComponent } from './expenses-edit/expenses-edit.component';
import { ReceiptScannerComponent } from './receipt-scanner/receipt-scanner.component';
import { ExpensesCreateEnhancedComponent } from './expenses-create-enhanced/expenses-create-enhanced.component';

import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule, MatNavList } from "@angular/material/list";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatBottomSheetModule,
} from "@angular/material/bottom-sheet";
import { MatGridListModule } from "@angular/material/grid-list";
import { ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [
    ExpensesCreateComponent,
    ExpensesListComponent,
    SidebarComponent,
    ExpensesEditComponent,
    ReceiptScannerComponent,
    ExpensesCreateEnhancedComponent,
  ],
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatNavList,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatMenuModule,
    MatSelectModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatDatepickerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
  ],
  exports: [
    ExpensesCreateComponent,
    ExpensesEditComponent,
    ExpensesListComponent,
    SidebarComponent,
    AsyncPipe,
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatNavList,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatMenuModule,
    MatSelectModule,
    MatBottomSheetModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatDatepickerModule,
    MatChipsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComponentsModule {}
