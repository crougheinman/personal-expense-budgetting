import { ComponentType } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, finalize } from 'rxjs';

@UntilDestroy()
@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private readonly defaultDialogData = {
        confirmBtnText: 'Save',
        cancelBtnText: 'Reset All',
        closeOnConfirm: true,
    };

    isMaterialDialogOpen$ = new BehaviorSubject(false);

    constructor(public dialog: MatDialog) {}

    open(dialogComponent: ComponentType<any>, data: any): MatDialogRef<any> {
        console.log('epend');
        
        const dialogRef = this.dialog.open(dialogComponent, {
            data: {
                ...this.defaultDialogData,
                ...data,
            },
            width: data['width'] || '892px',
            height: data['height'] || 'auto',
            maxWidth: data['maxWidth'] || 'auto',
            maxHeight: data['maxHeight'] || 'auto',
            panelClass: data['panelClass'] || 'accenture-dialog',
            position: data['position'] || '',
            disableClose: data['disableClose'] || false,
            restoreFocus: data['restoreFocus'] || false,
            backdropClass: data['backdropClass'] || '',
            autoFocus: data['autoFocus'] || false,
        });

        dialogRef
            .afterOpened()
            .pipe(
                untilDestroyed(this),
                finalize(() => this.isMaterialDialogOpen$.next(true)),
            )
            .subscribe();

        dialogRef
            .afterClosed()
            .pipe(
                untilDestroyed(this),
                finalize(() => this.isMaterialDialogOpen$.next(false)),
            )
            .subscribe();

        return dialogRef;
    }

    close(): void {
        this.dialog.closeAll();
    }
}
