import { Injectable } from "@angular/core";
import {
  Auth,
  AuthErrorCodes,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "@angular/fire/auth";
import { Router } from "@angular/router";
import { User } from "@models";
import { Store } from "@ngrx/store";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
} from "rxjs";
import { AppState, setAuthenticatedUser } from "@app/store";

export interface SignInFacadeModel {
  isLoading: boolean;
  errorMessage?: string | null;
}

const initialState: SignInFacadeModel = {
  isLoading: false,
  errorMessage: null,
};

@Injectable()
export class SignInFacade {
  vm$: Observable<SignInFacadeModel>;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  errorMessage$: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  googleAuthProvider = new GoogleAuthProvider();

  constructor(
    private auth: Auth,
    private store: Store<AppState>,
    private router: Router,
  ) {
    this.vm$ = this.buildViewModel();
  }

  private buildViewModel(): Observable<SignInFacadeModel> {
    return combineLatest([
      this.isLoading$.asObservable().pipe(distinctUntilChanged()),
      this.errorMessage$.asObservable().pipe(distinctUntilChanged()),
    ]).pipe(
      map(([isLoading, errorMessage]) => {
        return {
          isLoading,
          errorMessage,
        };
      })
    );
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    this.errorMessage$.next(null);
    this.isLoading$.next(true);
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(["/expenses/list"]);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.message.includes(AuthErrorCodes.USER_DELETED)) {
        this.errorMessage$.next("User not found. Please check your email.");
      }
      if (error.message.includes(AuthErrorCodes.INVALID_PASSWORD)) {
        this.errorMessage$.next("Invalid password. Please try again.");
      }
      if (error.message.includes(AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER)) {
        this.errorMessage$.next("Too many attempts. Please try again later.");
      }
      if (error.message.includes(AuthErrorCodes.OPERATION_NOT_ALLOWED)) {
        this.errorMessage$.next(
          "Operation not allowed. Please contact support."
        );
      }
      if (error.message.includes(AuthErrorCodes.INTERNAL_ERROR)) {
        this.errorMessage$.next("Internal error. Please try again later.");
      }
      if (error.message.includes(AuthErrorCodes.INVALID_EMAIL)) {
        this.errorMessage$.next(
          "Invalid email format. Please check your email."
        );
      }
    } finally {
      this.isLoading$.next(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(this.auth, this.googleAuthProvider);
    } catch (error: any) {
      if (error.message.includes(AuthErrorCodes.POPUP_CLOSED_BY_USER)) {
        this.errorMessage$.next("Popup closed by user. Please try again.");
      }
      if (error.message.includes(AuthErrorCodes.POPUP_BLOCKED)) {
        this.errorMessage$.next(
          "Popup blocked. Please allow popups and try again."
        );
      }
    }
  }
}
