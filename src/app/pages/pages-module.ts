import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Home } from "./home/home.component";
import { ExpensesComponent } from "./expenses/expenses.component";
import { ComponentsModule } from "@components";
import { NotFoundComponent } from "./not-found/not-found.component";
import { SignInComponent } from "./auth/sign-in/sign-in.component";
import { SignUpComponent } from "./auth/sign-up/sign-up.component";
import { ForgotPasswordComponent } from "./auth/forgot-password/forgot-password.component";
import { InventoryComponent } from "./inventory/inventory.component";

@NgModule({
  declarations: [
    ExpensesComponent,
    InventoryComponent,
    Home,
    NotFoundComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
  ],
  imports: [ComponentsModule, CommonModule,],
  exports: [ComponentsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
