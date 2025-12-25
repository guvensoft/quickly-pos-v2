import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'price',
    standalone: true
})
export class PricePipe implements PipeTransform {
    constructor() { }

    transform(value: number | null | undefined): string {
        if (!value) value = 0;
        return '₺ ' + Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
}
