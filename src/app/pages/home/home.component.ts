import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeFacade, HomeFacadeModel } from './home.facade';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeFacade],
})
export class Home {
  vm$: Observable<HomeFacadeModel> = of({});
  constructor(private facade: HomeFacade) { 
    this.vm$ = this.facade.vm$;
  }
}
