import { Pipe, PipeTransform } from '@angular/core';
import { MainService } from '../../core/services/main.service';

@Pipe({
    name: 'general',
    standalone: true
})
export class GeneralPipe implements PipeTransform {

    constructor(private mainService: MainService) { }

    transform(value: any, args: string, property?: string): Promise<any> {
        return this.mainService.getData(args, value).then((result: any) => {
            if (property) {
                return result[property];
            } else {
                return result.name;
            }
        }).catch((err: any) => {
            return value;
        });
    }

}
