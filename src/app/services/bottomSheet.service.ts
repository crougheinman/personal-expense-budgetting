import { ComponentType } from "@angular/cdk/overlay";
import { Injectable } from "@angular/core";
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from "@angular/material/bottom-sheet";
import { UntilDestroy} from "@ngneat/until-destroy";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class BottomSheetService {

  constructor(public bottomSheet: MatBottomSheet) {}

  open(dialogComponent: ComponentType<any>): MatBottomSheetRef<any> {
    console.log("bottomsheet");

    const dialogRef = this.bottomSheet.open(dialogComponent);
    return dialogRef;
  }

  close(): void {
    this.bottomSheet.dismiss();
  }
}
