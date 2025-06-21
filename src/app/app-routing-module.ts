import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent, Home, Login } from '@pages';
import { ExpensesCreateComponent } from '@components'

const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'expenses', children: [
            {path: '', redirectTo: 'list', pathMatch: 'full'},
            {path: 'list', component: ExpensesComponent},
            {path: 'create', component: ExpensesCreateComponent}
        ] 
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
