import { Component, OnInit, inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { SignInFacade, SignInFacadeModel } from "./sign-in.facade";
import { Observable } from "rxjs";

@Component({
  selector: "pages-sign-in",
  standalone: false,
  templateUrl: "./sign-in.component.html",
  styleUrl: "./sign-in.component.scss",
  providers: [SignInFacade],
})
export class SignInComponent implements OnInit {
  vm$: Observable<SignInFacadeModel>;
  authform!: FormGroup;
  auth = inject(Auth);
  /** "signin" logs into an existing account; "register" creates one. */
  mode: "signin" | "register" = "signin";

  constructor(private facade: SignInFacade) {
    this.authform = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(6),
      ]),
    });

    this.vm$ = this.facade.vm$;
  }

  ngOnInit(): void {
    // Complete a redirect-based Google sign-in if we just returned from one.
    this.facade.handleRedirectResult();
  }

  toggleMode(): void {
    this.mode = this.mode === "signin" ? "register" : "signin";
  }

  async onSubmit(): Promise<void> {
    if (this.authform.invalid) {
      this.authform.markAllAsTouched();
      return;
    }
    const { email, password } = this.authform.value;
    if (this.mode === "register") {
      await this.facade.registerWithEmail(email, password);
    } else {
      await this.facade.signInWithEmail(email, password);
    }
  }

  async onSignInWithGoogle(): Promise<void> {
    await this.facade.signInWithGoogle();
  }
}
