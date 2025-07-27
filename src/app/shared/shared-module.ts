import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as utils from './utils';
import { GlobalStoreModule } from '@app/store';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GlobalStoreModule,
    MatBottomSheetModule
  ],
})
export class ServicesModule { }
