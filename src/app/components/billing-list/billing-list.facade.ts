import { Injectable } from "@angular/core";
import { Billing } from "@models";
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, startWith } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState, selectAuthenticatedUser } from "@store";
import { BillingService } from "@app/services/billing.service";
import { MatSnackBar } from "@angular/material/snack-bar";

export interface BillingListFacadeModel {
  billingItems?: Billing[];
  filteredCount: number;
  totalCount: number;
}

export const initialState: BillingListFacadeModel = {
  billingItems: [],
  filteredCount: 0,
  totalCount: 0,
};

@Injectable()
export class BillingListFacade {
  vm$: Observable<BillingListFacadeModel> = of(initialState);
  searchKey$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private billingService: BillingService,
    private store: Store<AppState>,
    private snackbarService: MatSnackBar,
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<BillingListFacadeModel> {
    return combineLatest([
      this.getBillingItems(),
      this.searchKey$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([billingItems, searchKey]) => {
        let filteredItems = billingItems;
        
        // Filter by search key
        if (searchKey.length > 0) {
          filteredItems = filteredItems.filter((item) => 
            item.name.toLowerCase().includes(searchKey.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchKey.toLowerCase()))
          );
        }
        
        return {
          billingItems: filteredItems,
          filteredCount: filteredItems.length,
          totalCount: billingItems.length,
        };
      }),
      startWith(initialState),
    );
  }

  private getBillingItems(): Observable<Billing[]> {
    return combineLatest([
      this.billingService.getBills(),
      this.store.select(selectAuthenticatedUser),
    ]).pipe(
      map(([billingItems, user]) => {
        return billingItems.filter((item) => item.userId === user.id);
      })
    );
  }

  updateSearchKey(value: string): void {
    this.searchKey$.next(value);
  }
}
