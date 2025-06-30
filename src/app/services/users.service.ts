import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private angularFireAuth: AngularFireAuth) { }

    async logout(): Promise<void> {
        try {
            await this.angularFireAuth.signOut();
        } catch {
            console.error('Log out failed');
        }
    }
}
