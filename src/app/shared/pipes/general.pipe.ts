/* eslint-disable @angular-eslint/prefer-inject, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
import { Pipe, PipeTransform, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { MainService } from '../../core/services/main.service';
import { from, of, catchError, map, tap, Observable } from 'rxjs';

@Pipe({
    name: 'general',
    standalone: true
})
export class GeneralPipe implements PipeTransform {
    private mainService = inject(MainService);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone);

    transform(value: any, args: string, property?: string): Observable<any> {
        return new Observable(subscriber => {
            // Ensure subscription and emission happen within Angular zone
            this.zone.run(() => {
                const promise = this.mainService.getData(args as any, value);
                from(promise).pipe(
                    map((result: any) => {
                        if (property) {
                            return result[property];
                        } else {
                            return result.name;
                        }
                    }),
                    tap(() => {
                        // Explicitly mark for check when data arrives
                        this.cdr.markForCheck();
                    }),
                    catchError((err: any) => {
                        return of(value);
                    })
                ).subscribe(subscriber);
            });
        });
    }

}

