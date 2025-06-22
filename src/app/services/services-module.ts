import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from './firestore.service';
import { ExpensesService } from './expenses.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [ FirestoreService, ExpensesService ]
})
export class ServicesModule { }
