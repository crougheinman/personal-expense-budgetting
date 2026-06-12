import { Injectable } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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
      this.errorMessage$.next(this.emailErrorMessage(error));
    } finally {
      this.isLoading$.next(false);
    }
  }

  /** Creates a new email/password account, then signs the user in. */
  async registerWithEmail(email: string, password: string): Promise<void> {
    this.errorMessage$.next(null);
    this.isLoading$.next(true);
    try {
      await createUserWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(["/expenses/list"]);
    } catch (error: any) {
      console.error("Registration error:", error);
      this.errorMessage$.next(this.emailErrorMessage(error));
    } finally {
      this.isLoading$.next(false);
    }
  }

  private emailErrorMessage(error: any): string {
    switch (error?.code ?? "") {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account with this email already exists — try signing in.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled for this project.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return "Authentication failed. Please try again.";
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.errorMessage$.next(null);
    this.isLoading$.next(true);
    try {
      await signInWithPopup(this.auth, this.googleAuthProvider);
      this.router.navigate(["/expenses/list"]);
    } catch (error: any) {
      const code = error?.code ?? "";
      if (code === "auth/popup-closed-by-user") {
        // User dismissed the popup themselves — no error to show.
      } else if (
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        // Popups are unreliable on some mobile browsers — fall back to redirect.
        try {
          await signInWithRedirect(this.auth, this.googleAuthProvider);
          return; // the page navigates away; result handled on return
        } catch (redirectError: any) {
          console.error("Google redirect sign-in error:", redirectError);
          this.errorMessage$.next(this.googleErrorMessage(redirectError));
        }
      } else {
        console.error("Google sign-in error:", error);
        this.errorMessage$.next(this.googleErrorMessage(error));
      }
    } finally {
      this.isLoading$.next(false);
    }
  }

  /** Completes a redirect-based Google sign-in when the user returns to the app. */
  async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        this.router.navigate(["/expenses/list"]);
      }
    } catch (error: any) {
      console.error("Google redirect result error:", error);
      this.errorMessage$.next(this.googleErrorMessage(error));
    }
  }

  private googleErrorMessage(error: any): string {
    const code = error?.code ?? "";
    if (code === "auth/unauthorized-domain") {
      return (
        "This address isn't authorized for Google sign-in. Open the app at its " +
        "deployed URL (https://ang-fire-b15d9.web.app), or add this host under " +
        "Firebase Console → Authentication → Settings → Authorized domains."
      );
    }
    if (code === "auth/network-request-failed") {
      return "Network error reaching Google. Check your connection and try again.";
    }
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the sign-in popup. Allow popups and try again.";
    }
    return "Google sign-in failed. Please try again.";
  }
}
