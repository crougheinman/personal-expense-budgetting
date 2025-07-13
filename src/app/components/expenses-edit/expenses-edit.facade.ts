import { Injectable } from '@angular/core';
import { AppState, selectAuthenticatedUser } from '@app/store';
import { Expense } from '@models'
import { Store } from '@ngrx/store';
import { ExpensesService } from '@services';
import { combineLatest, map, Observable, of } from 'rxjs';

export interface ExpensesEditFacadeModel {
    userId: string | undefined,
};

export const initialState: ExpensesEditFacadeModel = {
    userId: '',
};

@Injectable()
export class ExpensesEditFacade {
    vm$: Observable<ExpensesEditFacadeModel> = of(initialState);
    constructor(
        private expensesService: ExpensesService,
        private store: Store<AppState>,
    ) { 
        this.vm$ = this.buildViewModel();
    }

    private buildViewModel(): Observable<ExpensesEditFacadeModel> {
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

    async editExpense(expense: Partial<Expense>): Promise<void> {
        await this.expensesService.updateExpense(expense);
    }

    async deleteExpense(expense: Partial<Expense>): Promise<void> {
        await this.expensesService.deleteExpense(expense);
    }
}