/* eslint-disable @angular-eslint/prefer-inject, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
import { Pipe, PipeTransform } from '@angular/core';
import { MainService } from '../../core/services/main.service';
import { from, of, catchError, map } from 'rxjs';

@Pipe({
    name: 'general',
    standalone: true
})
export class GeneralPipe implements PipeTransform {

    constructor(private mainService: MainService) { }

    transform(value: any, args: string, property?: string) {
        return from(this.mainService.getData(args as any, value)).pipe(
            map((result: any) => {
                if (property) {
                    return result[property];
                } else {
                    return result.name;
                }
            }),
            catchError((err: any) => {
                return of(value);
            })
        );
    }

}
