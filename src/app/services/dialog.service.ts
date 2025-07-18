import { ComponentType } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, finalize } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@UntilDestroy()
@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private readonly defaultDialogData = {
        confirmBtnText: 'Save',
        cancelBtnText: 'Reset All',
        closeOnConfirm: true,
        mobileFullscreen: false,
        showCloseButton: true,
    };

    isMaterialDialogOpen$ = new BehaviorSubject(false);

    constructor(
        public dialog: MatDialog,
        private breakpointObserver: BreakpointObserver
    ) {}

    open(dialogComponent: ComponentType<any>, data: any): MatDialogRef<any> {
        console.log('epend');
        
        const isMobile = this.breakpointObserver.isMatched([
            Breakpoints.XSmall,
            Breakpoints.Small
        ]);
        
        const shouldUseFullscreen = data['mobileFullscreen'] !== false && isMobile;
        
        let dialogConfig: any = {
            data: {
                ...this.defaultDialogData,
                ...data,
                isMobile,
                showCloseButton: data['showCloseButton'] !== false,
            },
            disableClose: data['disableClose'] || false,
            restoreFocus: data['restoreFocus'] || false,
            backdropClass: data['backdropClass'] || '',
            autoFocus: data['autoFocus'] || false,
        };

        if (shouldUseFullscreen) {
            dialogConfig = {
                ...dialogConfig,
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                panelClass: ['mobile-fullscreen-dialog', data['panelClass'] || ''].filter(Boolean),
                position: { top: '0', left: '0' },
            };
        } else {
            dialogConfig = {
                ...dialogConfig,
                width: data['width'] || '892px',
                height: data['height'] || 'auto',
                maxWidth: data['maxWidth'] || 'auto',
                maxHeight: data['maxHeight'] || 'auto',
                panelClass: data['panelClass'] || '',
                position: data['position'] || '',
            };
        }
        
        const dialogRef = this.dialog.open(dialogComponent, dialogConfig);

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
