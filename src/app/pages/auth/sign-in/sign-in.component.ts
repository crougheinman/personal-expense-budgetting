import { Component, inject } from "@angular/core";
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
export class SignInComponent {
  vm$: Observable<SignInFacadeModel>;
  authform!: FormGroup;
  auth = inject(Auth);

  constructor(private facade: SignInFacade) {
    this.authform = new FormGroup({
      email: new FormControl("", Validators.required),
      password: new FormControl("", Validators.required),
    });

    this.vm$ = this.facade.vm$;
  }

  async onSignIn(): Promise<void> {
    const { email, password } = this.authform.value;
    await this.facade.signInWithEmail(email, password);
  }

  async onSignInWithGoogle(): Promise<void> {
    await this.facade.signInWithGoogle();
  }
}
