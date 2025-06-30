import { Injectable } from '@angular/core';
import { AppState, signOut } from '@store';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private store: Store<AppState>,
  ) { }

  async logout(): Promise<void> {
    try {
      this.store.dispatch(signOut());
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
}
