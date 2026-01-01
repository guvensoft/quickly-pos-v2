/* eslint-disable */
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[oneShot]',
    standalone: true
})
export class ButtonDirective {

    @Input('oneShot') isActive: any = true;

    constructor(private element: ElementRef) { }

    @HostListener('click') onClick() {
        if (this.isActive !== false && this.isActive !== 'false') {
            this.element.nativeElement.disabled = true;
        }
    }
}
