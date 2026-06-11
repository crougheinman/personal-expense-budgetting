import { ChangeDetectionStrategy, Component } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { Router } from "@angular/router";
import { AuthService, ThemeService, AppTheme } from "@services";
import { SidebarFacade, SidebarFacadeModel } from "./sidebar-facade";

@Component({
  selector: "components-custom-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SidebarFacade],
})
export class SidebarComponent {
  isHandset$: Observable<boolean>;
  vm$: Observable<SidebarFacadeModel>;
  theme$: Observable<AppTheme>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private facade: SidebarFacade
  ) {
    // Match the 768px CSS breakpoint used for the bottom-bar / sidebar swap.
    this.isHandset$ = this.breakpointObserver
      .observe("(max-width: 767.98px)")
      .pipe(
        map((result) => result.matches),
        shareReplay()
      );

    this.vm$ = this.facade.vm$;
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  viewProfile(): void {
    // TODO: Implement profile view functionality
    console.log("View profile clicked");
  }

  openSettings(): void {
    this.router.navigate(["/settings/expenses"]);
  }
}
