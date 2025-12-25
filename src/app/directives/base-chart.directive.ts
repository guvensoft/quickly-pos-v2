import { Directive, Input } from '@angular/core';

@Directive({
  selector: 'canvas[baseChart]',
  standalone: true,
})
export class BaseChartDirective {
  @Input() data?: unknown;
  @Input() datasets?: unknown;
  @Input() labels?: unknown;
  @Input() options?: unknown;
  @Input() legend?: unknown;
  @Input() colors?: unknown;
  @Input() chartType?: unknown;
  @Input() type?: unknown;
}
