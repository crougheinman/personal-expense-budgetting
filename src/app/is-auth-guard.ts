import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Auth } from "@angular/fire/auth";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState } from "@store";
import { setAuthenticatedUser } from "@store";
import { User } from "@app/models";

@Injectable({
  providedIn: "root",
})
export class IsAuthenticatedGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private store: Store<AppState>
  ) {}

  canActivate(): Observable<boolean> {
    return new Observable((subscriber) => {
      this.auth.onAuthStateChanged((user) => {
        if (!user) {
          subscriber.next(true);
        } else {
          this.router.navigate(["/"]);
          subscriber.next(false);
        }
        subscriber.complete();
      });
    });
  }
}
