/* eslint-disable */
import { Directive, ElementRef, HostListener, input } from '@angular/core';

@Directive({
    selector: '[oneShot]',
    standalone: true
})
export class ButtonDirective {

    readonly isActive = input<any>(true, { alias: 'oneShot' });

    constructor(private element: ElementRef) { }

    @HostListener('click') onClick() {
        if (this.isActive() !== false && this.isActive() !== 'false') {
            this.element.nativeElement.disabled = true;
        }
    }
}
