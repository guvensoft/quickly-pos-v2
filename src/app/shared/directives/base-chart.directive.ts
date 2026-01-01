import { Directive, input } from '@angular/core';

@Directive({
    selector: 'canvas[baseChart]',
    standalone: true,
})
export class BaseChartDirective {
    readonly data = input<unknown>();
    readonly datasets = input<unknown>();
    readonly labels = input<unknown>();
    readonly options = input<unknown>();
    readonly legend = input<unknown>();
    readonly colors = input<unknown>();
    readonly chartType = input<unknown>();
    readonly type = input<unknown>();
}
