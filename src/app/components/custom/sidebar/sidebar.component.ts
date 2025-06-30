import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { AuthService } from "@services";
import { SidebarFacade, SidebarFacadeModel } from "./sidebar-facade";

@Component({
  selector: "components-custom-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SidebarFacade]
})
export class SidebarComponent {
  isHandset$: Observable<boolean>;
  vm$: Observable<SidebarFacadeModel>;

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private authService: AuthService,
    private facade: SidebarFacade,
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay(),
    );

    this.vm$ = this.facade.vm$;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
