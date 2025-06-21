import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExpensesListFacade, ExpensesListFacadeModel } from './expenses-list.facade';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'component-expenses-list',
  templateUrl: './expenses-list.component.html',
  styleUrl: './expenses-list.component.scss',
  providers: [ExpensesListFacade],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpensesListComponent {

  vm$: Observable<ExpensesListFacadeModel> = of({});

  constructor(private expensesListFacade: ExpensesListFacade) {
    this.vm$ = this.expensesListFacade.vm$;
  }

}
