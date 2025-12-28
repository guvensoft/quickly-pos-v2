/* eslint-disable @angular-eslint/prefer-inject, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
import { Pipe, PipeTransform, ChangeDetectorRef, inject } from '@angular/core';
import { MainService } from '../../core/services/main.service';
import { from, of, catchError, map, tap } from 'rxjs';

@Pipe({
    name: 'general',
    standalone: true
})
export class GeneralPipe implements PipeTransform {
    private mainService = inject(MainService);
    private cdr = inject(ChangeDetectorRef);

    transform(value: any, args: string, property?: string) {
        return from(this.mainService.getData(args as any, value)).pipe(
            map((result: any) => {
                if (property) {
                    return result[property];
                } else {
                    return result.name;
                }
            }),
            tap(() => {
                // Mark component for check on successful data load
                this.cdr.markForCheck();
            }),
            catchError((err: any) => {
                return of(value);
            })
        );
    }

}
