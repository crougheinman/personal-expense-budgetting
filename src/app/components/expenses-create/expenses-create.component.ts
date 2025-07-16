import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { ExpensesCreateFacade, ExpensesCreateFacadeModel, initialState } from "./expenses-create.facade";
import { MatDialogRef } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import moment from "moment";
import { Timestamp } from "firebase/firestore";
import { CameraError, CameraPhoto } from "../camera/camera.component";

@Component({
  selector: "app-expenses-create.component",
  templateUrl: "./expenses-create.component.html",
  styleUrl: "./expenses-create.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExpensesCreateFacade],
})
export class ExpensesCreateComponent {
  expensesForm!: FormGroup;
  vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);

  constructor(
    private facade: ExpensesCreateFacade,
    private formBuilder: FormBuilder,
    private matDialogRef: MatDialogRef<ExpensesCreateComponent>,
  ) {
    this.vm$ = this.facade.vm$;
    this.expensesForm = this.formBuilder.group({
      expenseName: new FormControl<string | null>(null),
      expenseAmount: new FormControl<string | null>(null),
    });
    this.nameControl.setValue("");
    this.amountControl.setValue("");
  }

  get nameControl(): AbstractControl {
    return this.expensesForm.get("expenseName") as AbstractControl;
  }

  get amountControl(): AbstractControl {
    return this.expensesForm.get("expenseAmount") as AbstractControl;
  }

  async addExpenses(vm: ExpensesCreateFacadeModel): Promise<void> {
    await this.facade.addExpense({
      userId: vm.userId,
      name: this.nameControl.value,
      amount: this.amountControl.value,
      expenseDate: Timestamp.fromDate(moment().toDate()),
    });
    
    this.matDialogRef.close();
  }

  openCamera(): void {
    this.facade.openCamera();
  }

  closeCamera(): void {
    this.facade.closeCamera();
  }

  onPhotoTaken(event: CameraPhoto): void {
    console.log('Photo captured:', event);
    // Handle the captured photo
    this.processPhoto(event.file);
    this.closeCamera();
  }

  onCameraError(): void {
    console.error('Camera error occurred');
    // Handle camera errors
    alert(`Camera Error: An error occurred while accessing the camera. Please try again later.`);
  }

  onCameraStarted(): void {
    console.log('Camera started successfully');
  }

  onCameraStopped(): void {
    console.log('Camera stopped');
    this.closeCamera();
  }

  private processPhoto(file: File): void {
    // Process the captured photo
    // Upload to server, apply filters, etc.
  }
}
