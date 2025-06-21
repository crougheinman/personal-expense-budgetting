import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Home } from "./home/home.component";
import { Login } from "./login/login.component";
import { ExpensesComponent } from "./expenses/expenses.component";
import { ComponentsModule } from "@components";

@NgModule({
  declarations: [ExpensesComponent, Home, Login],
  imports: [ComponentsModule, CommonModule],
  exports: [ComponentsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PagesModule {}
