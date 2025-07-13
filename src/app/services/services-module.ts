import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from './firestore.service';
import { ExpensesService } from './expenses.service';
import { UsersService } from './users.service';
import { GlobalStoreModule } from '@app/store';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GlobalStoreModule,
    MatBottomSheetModule
  ],
  providers: [ FirestoreService, ExpensesService, UsersService],
})
export class ServicesModule { }
