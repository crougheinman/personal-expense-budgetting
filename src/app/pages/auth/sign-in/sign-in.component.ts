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

  private readonly RECAPTCHA_SITE_KEY =
    "6LereIgsAAAAAI-P3JDiv7c49d1NjsrcWf6p7laM";
  private recaptchaToken: string | null = null;
  private recaptchaWidgetId: number | null = null;

  constructor(private facade: SignInFacade) {
    this.authform = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl(""),
    });

    this.vm$ = this.facade.vm$;
  }

  ngOnInit(): void {
    // Complete a redirect-based Google sign-in if we just returned from one.
    this.facade.handleRedirectResult();
    this.loadRecaptchaScript();
  }

  toggleMode(): void {
    this.mode = this.mode === "signin" ? "register" : "signin";
    this.recaptchaToken = null;
    this.authform.get("confirmPassword")?.reset("");
    if (this.mode === "register") {
      this.recaptchaWidgetId = null; // render fresh into the new container
      setTimeout(() => this.renderRecaptcha(), 0);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.authform.invalid) {
      this.authform.markAllAsTouched();
      return;
    }
    const { email, password, confirmPassword } = this.authform.value;

    if (this.mode === "register") {
      if (password !== confirmPassword) {
        this.facade.setError("Passwords do not match.");
        return;
      }
      if (!this.recaptchaToken) {
        this.facade.setError("Please complete the reCAPTCHA.");
        return;
      }
      await this.facade.registerWithEmail(email, password);
      this.resetRecaptcha(); // token is single-use; reset for any retry
    } else {
      await this.facade.signInWithEmail(email, password);
    }
  }

  async onSignInWithGoogle(): Promise<void> {
    await this.facade.signInWithGoogle();
  }

  // ---- reCAPTCHA v2 ----
  private loadRecaptchaScript(): void {
    if (typeof window === "undefined" || (window as any).grecaptcha) {
      return;
    }
    if (document.getElementById("recaptcha-api")) {
      return;
    }
    const s = document.createElement("script");
    s.id = "recaptcha-api";
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  private renderRecaptcha(): void {
    const g = (window as any).grecaptcha;
    const el = document.getElementById("recaptcha-container");
    if (!el) {
      return;
    }
    if (!g || !g.render) {
      setTimeout(() => this.renderRecaptcha(), 300); // script still loading
      return;
    }
    if (this.recaptchaWidgetId !== null) {
      try {
        g.reset(this.recaptchaWidgetId);
      } catch {
        /* ignore */
      }
      return;
    }
    this.recaptchaWidgetId = g.render(el, {
      sitekey: this.RECAPTCHA_SITE_KEY,
      callback: (token: string) => (this.recaptchaToken = token),
      "expired-callback": () => (this.recaptchaToken = null),
      "error-callback": () => (this.recaptchaToken = null),
    });
  }

  private resetRecaptcha(): void {
    this.recaptchaToken = null;
    const g = (window as any).grecaptcha;
    if (g && this.recaptchaWidgetId !== null) {
      try {
        g.reset(this.recaptchaWidgetId);
      } catch {
        /* ignore */
      }
    }
  }
}
