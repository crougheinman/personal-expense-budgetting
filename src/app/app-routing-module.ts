import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent, ForgotPasswordComponent, Home, NotFoundComponent, SignInComponent, SignUpComponent } from '@pages';
import { ExpensesCreateComponent } from '@components'
import { AuthGuard } from './auth-guard';

const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'auth', children: [
            {path: '', redirectTo: 'signin', pathMatch: 'full'},
            {path: 'signin', component: SignInComponent},
            {path: 'signup', component:SignUpComponent},
            {path: 'forgot-password', component: ForgotPasswordComponent}
        ]
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
        path: 'notFound',
        component: NotFoundComponent
    },
    {
        path: '**',
        redirectTo: 'notFound'
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
