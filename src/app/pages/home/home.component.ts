import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DialogService } from '@services';
import {
  HomeFacade,
  HomeFacadeModel,
  PebbyReport,
  StatGranularity,
  StatsView,
  initialState,
} from './home.facade';
import { map, Observable, of, shareReplay } from 'rxjs';
import { BillingCreateComponent, ExpensesCreateComponent, InventoryCreateComponent } from '@components';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HomeFacade],
})
export class Home {
  vm$: Observable<HomeFacadeModel> = of(initialState);
  pebby$: Observable<PebbyReport> = of({ status: 'loading', message: '' });
  // Pebby with a pre-rendered, word-staggered HTML body (computed once per
  // emission so the typing animation runs once, not on every change detection).
  pebbyView$: Observable<PebbyReport & { html: SafeHtml | null }> = of({
    status: 'loading',
    message: '',
    html: null,
  });
  isHandset$: Observable<boolean>;

  constructor(
    private facade: HomeFacade,
    private router: Router,
    private dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer,
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay(),
    );

    this.vm$ = this.facade.vm$;
    this.pebby$ = this.facade.pebby$;
    this.pebbyView$ = this.facade.pebby$.pipe(
      map((report) => ({
        ...report,
        html:
          report.status === 'ready'
            ? this.formatPebby(report.message)
            : null,
      })),
    );
  }

  /**
   * Renders Pebby's light-Markdown message to safe HTML: escapes the text,
   * supports **bold** and "- " bullet lines, and wraps each word in a span with
   * a staggered animation delay so it reveals word-by-word like live speech.
   * We escape all dynamic text ourselves, so bypassing the sanitizer is safe.
   */
  private formatPebby(message: string): SafeHtml {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let wordIndex = 0;
    const wrapWords = (text: string, bold: boolean): string =>
      text
        .split(/(\s+)/)
        .map((part) => {
          if (part.trim() === '') {
            return part; // keep the whitespace between words
          }
          const delay = wordIndex++ * 45;
          const inner = esc(part);
          const body = bold ? `<strong>${inner}</strong>` : inner;
          return `<span class="pw" style="animation-delay:${delay}ms">${body}</span>`;
        })
        .join('');

    const renderInline = (text: string): string => {
      // Toggle bold on each ** delimiter.
      let bold = false;
      return text
        .split('**')
        .map((seg) => {
          const out = wrapWords(seg, bold);
          bold = !bold;
          return out;
        })
        .join('');
    };

    let html = '';
    let bullets: string[] = [];
    const flush = () => {
      if (bullets.length) {
        html += `<ul class="pebby-list">${bullets
          .map((li) => `<li>${li}</li>`)
          .join('')}</ul>`;
        bullets = [];
      }
    };

    for (const line of message.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) {
        flush();
        continue;
      }
      const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
      if (bullet) {
        bullets.push(renderInline(bullet[1]));
      } else {
        flush();
        html += `<p class="pebby-line">${renderInline(trimmed)}</p>`;
      }
    }
    flush();

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Whether the floating Pebby chat panel is open. */
  pebbyOpen = false;

  togglePebby(): void {
    this.pebbyOpen = !this.pebbyOpen;
  }

  closePebby(): void {
    this.pebbyOpen = false;
  }

  refreshPebby(): void {
    this.facade.refresh();
  }

  previousMonth(): void {
    this.facade.previousMonth();
  }

  nextMonth(): void {
    this.facade.nextMonth();
  }

  // ---- Statistics card ----
  readonly chartW = 320;
  readonly chartH = 132;
  private readonly chartPad = 16;

  setGranularity(g: StatGranularity): void {
    this.facade.setGranularity(g);
  }

  /**
   * Computes the SVG geometry for the area chart from the stats series: a smooth
   * (Catmull-Rom) line path, a filled area path, the evenly-spaced column
   * x-positions, and the highlighted peak point coordinates.
   */
  buildChart(stats: StatsView): {
    line: string;
    area: string;
    cols: { x: number; label: string }[];
    peak: { x: number; y: number };
    baseline: number;
  } {
    const pts = stats.points;
    const n = pts.length;
    const w = this.chartW;
    const h = this.chartH;
    const pad = this.chartPad;
    const max = Math.max(...pts.map((p) => p.amount), 1);

    const xy = pts.map((p, i) => {
      const x = n <= 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad);
      const y = h - pad - (p.amount / max) * (h - 2 * pad);
      return [x, y] as [number, number];
    });

    const line = this.smoothPath(xy);
    const baseline = h - pad;
    const area =
      xy.length > 0
        ? `${line} L ${xy[xy.length - 1][0]} ${baseline} L ${xy[0][0]} ${baseline} Z`
        : "";

    const cols = xy.map(([x], i) => ({ x, label: pts[i].label }));
    const peakXY = xy[stats.peakIndex] ?? [w / 2, h / 2];

    return {
      line,
      area,
      cols,
      peak: { x: peakXY[0], y: peakXY[1] },
      baseline,
    };
  }

  /** Catmull-Rom → cubic Bézier smoothing for a soft area-chart curve. */
  private smoothPath(pts: [number, number][]): string {
    if (pts.length === 0) {
      return "";
    }
    if (pts.length === 1) {
      return `M ${pts[0][0]} ${pts[0][1]}`;
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  navigateToExpenses(): void {
    this.router.navigate(['/expenses/list']);
  }

  navigateToBills(): void {
    this.router.navigate(['/billing/list']);
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory/list']);
  }

  createNewExpense(): void {
    this.dialogService.open(ExpensesCreateComponent, {
      width: '500px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  createNewItem(): void {
    this.dialogService.open(InventoryCreateComponent, {
      width: '444px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  createNewBill(): void {
    this.dialogService.open(BillingCreateComponent, {
      width: '500px',
      mobileFullscreen: true,
      showCloseButton: true,
    });
  }

  viewAnalytics(): void {
    this.router.navigate(['/dashboard']);
  }
}
