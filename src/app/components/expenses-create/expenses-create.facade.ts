import { Injectable } from '@angular/core';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { combineLatest, map, Observable, of } from 'rxjs';

export interface ExpensesCreateFacadeModel {
    userId: string | undefined,
};

export const initialState: ExpensesCreateFacadeModel = {
    userId: '',
};

@Injectable()
export class ExpensesCreateFacade {
    vm$: Observable<ExpensesCreateFacadeModel> = of(initialState);
    constructor(
        private expensesService: ExpensesService,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<ExpensesCreateFacadeModel> {
        return combineLatest([
            this.store.select(selectAuthenticatedUser),
        ]).pipe(
            map(([user]) => {
                return {
                    userId: user.id,
                }
            })
        );
    }

    async addExpense(expense: Partial<Expense>): Promise<void> {
        await this.expensesService.addExpenses(expense);
    }
}