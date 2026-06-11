import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "peb.theme";

/**
 * Manages the app's light/dark theme. On first load it respects the persisted
 * choice, then the system preference, falling back to light. The active theme
 * is reflected via the `data-bs-theme` attribute on <html> (which drives both
 * Angular Material's `--mat-sys-*` and Bootstrap) and persisted to localStorage.
 *
 * An inline script in index.html applies the same value before first paint, so
 * this service only needs to keep state in sync and react to toggles.
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly _theme$ = new BehaviorSubject<AppTheme>(this.resolveInitial());
  readonly theme$: Observable<AppTheme> = this._theme$.asObservable();

  constructor() {
    // Sync the DOM to our resolved state WITHOUT persisting (covers a missing
    // pre-paint script). Persisting only happens on an explicit user toggle, so
    // a value that merely mirrors the OS preference doesn't get frozen.
    this.apply(this._theme$.value, false);
    this.watchSystemPreference();
  }

  get current(): AppTheme {
    return this._theme$.value;
  }

  setTheme(theme: AppTheme): void {
    this.apply(theme, true);
    if (theme !== this._theme$.value) {
      this._theme$.next(theme);
    }
  }

  toggle(): void {
    this.setTheme(this.current === "dark" ? "light" : "dark");
  }

  private apply(theme: AppTheme, persist: boolean): void {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.setAttribute("data-bs-theme", theme);
    root.style.colorScheme = theme;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore storage errors (private mode / quota)
      }
    }
  }

  /** Follow the OS light/dark preference until the user makes an explicit choice. */
  private watchSystemPreference(): void {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mq.addEventListener !== "function") {
      return;
    }
    mq.addEventListener("change", (event) => {
      if (this.readStored()) {
        return; // user has an explicit choice — don't override it
      }
      const next: AppTheme = event.matches ? "dark" : "light";
      this.apply(next, false);
      this._theme$.next(next);
    });
  }

  private resolveInitial(): AppTheme {
    // Prefer what the pre-paint script already set on <html>.
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-bs-theme");
      if (attr === "light" || attr === "dark") {
        return attr;
      }
    }
    const stored = this.readStored();
    if (stored) {
      return stored;
    }
    return this.systemPrefersDark() ? "dark" : "light";
  }

  private readStored(): AppTheme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  }

  private systemPrefersDark(): boolean {
    return (
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
}
