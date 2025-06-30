import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Auth } from "@angular/fire/auth";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState } from "@store";
import { setAuthenticatedUser } from "@app/store";
import { User } from "@app/models";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private store: Store<AppState>
  ) {}

  canActivate(): Observable<boolean> {
    return new Observable((subscriber) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.store.dispatch(
            setAuthenticatedUser({
              user: {
                email: user.email || "",
                uid: user.uid,
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                phoneNumber: user.phoneNumber || "",
                providerId: user.providerData[0]?.providerId || "",
              } as User,
            })
          );
          subscriber.next(true);
        } else {
          this.router.navigate(["/sign-in"]);
          subscriber.next(false);
        }
        subscriber.complete();
      });
    });
  }
}
