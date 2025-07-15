import { Injectable } from '@angular/core';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { combineLatest, map, Observable, of } from 'rxjs';

export interface ExpensesCreateEnhancedFacadeModel {
    userId: string;
};

export const initialState: ExpensesCreateEnhancedFacadeModel = {
    userId: '',
};

@Injectable()
export class ExpensesCreateEnhancedFacade {
    vm$: Observable<ExpensesCreateEnhancedFacadeModel> = of(initialState);

    constructor(
        private store: Store<AppState>,
        private expensesService: ExpensesService
    ) {
        this.vm$ = combineLatest([
            this.store.select(selectAuthenticatedUser),
        ]).pipe(
            map(([user]) => ({
                userId: user?.id || '',
            }))
        );
    }

    async addExpense(data: Partial<Expense>): Promise<void> {
        await this.expensesService.addExpenses(data);
    }
}
