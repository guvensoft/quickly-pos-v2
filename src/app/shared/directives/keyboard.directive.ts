import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { KeyboardService } from '../../core/services/keyboard.service';

@Directive({
    selector: 'input:not([type="checkbox"]):not([id="keyboardElement"]):not([readonly]),textarea:not([readonly])',
    standalone: true
})
export class KeyboardDirective {
    onAir: boolean;

    constructor(private element: ElementRef, private keyboardService: KeyboardService, private renderer: Renderer2) {
        this.onAir = false;
    }

    @HostListener('click') onClick(event?: Event) {
        this.keyboardService.triggerKeyboard('Open', this.element);
    }

    @HostListener('input') onInput() {
        this.element.nativeElement.focus();
    }

    @HostListener('blur') onBlur() {
        // this.keyboardService.triggerKeyboard('Close', this.element);
    }
}
