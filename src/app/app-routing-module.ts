import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent, ForgotPasswordComponent, Home, InventoryComponent, NotFoundComponent, SignInComponent, SignUpComponent } from '@pages';
import { ExpensesCreateComponent } from '@components'
import { AuthGuard } from './auth-guard';
import { IsAuthenticatedGuard } from './is-auth-guard';
import { InventoryCreateComponent } from './components/inventory-create/inventory-create.component';

const routes: Routes = [
    {
        path: 'dashboard/home',
        component: Home,
        canActivate: [AuthGuard] 
    },
    {
        path: 'auth', children: [
            {path: '', redirectTo: 'signin', pathMatch: 'full'},
            {path: 'signin', component: SignInComponent},
            {path: 'signup', component:SignUpComponent},
            {path: 'forgot-password', component: ForgotPasswordComponent}
        ],
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: 'expenses', children: [
            {path: '', redirectTo: 'list', pathMatch: 'full'},
            {path: 'list', component: ExpensesComponent},
            {path: 'create', component: ExpensesCreateComponent}
        ],
        canActivate: [AuthGuard] 
    },
    {
        path: 'inventory', children: [
            {path: '', redirectTo: 'list', pathMatch: 'full'},
            {path: 'list', component: InventoryComponent},
        ],
        canActivate: [AuthGuard] 
    },
    {
        path: 'notFound',
        component: NotFoundComponent
    },
    {
        path: '**',
        redirectTo: 'dashboard/home'
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
