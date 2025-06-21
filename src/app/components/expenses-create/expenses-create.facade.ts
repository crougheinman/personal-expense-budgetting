import { Injectable } from '@angular/core';
import { Expense } from '@models'
import { ExpensesService } from '@services';

@Injectable()
export class ExpensesCreateFacade {
    constructor(private expensesService: ExpensesService) { }

    async addExpense(expense: Partial<Expense>): Promise<string> {
        return await this.expensesService.addExpenses(expense);
    }
}