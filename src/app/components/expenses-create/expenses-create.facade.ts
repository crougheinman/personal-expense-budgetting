import { Injectable } from '@angular/core';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of } from 'rxjs';

export interface ExpensesCreateFacadeModel {
    userId: string | undefined,
    cameraOpened: boolean;
};

export const initialState: ExpensesCreateFacadeModel = {
    userId: '',
    cameraOpened: false,
};

@Injectable()
export class ExpensesCreateFacade {
    vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);
    cameraOpened$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private expensesService: ExpensesService,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<ExpensesCreateFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
            this.cameraOpened$.asObservable().pipe(distinctUntilChanged()),
        ]).pipe(
            map(([user, cameraOpened]) => {
                return {
                    userId: user.id,
                    cameraOpened,
                }
            })
        );
    }

    async addExpense(expense: Partial<Expense>): Promise<void> {
        await this.expensesService.addExpenses(expense);
    }

    openCamera(): void {
        this.cameraOpened$.next(true);
    }

    closeCamera(): void {
        this.cameraOpened$.next(false);
    }
}