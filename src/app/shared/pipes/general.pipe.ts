import { Pipe, PipeTransform } from '@angular/core';
import { DatabaseService } from '../../core/services/database.service';

@Pipe({
    name: 'general',
    standalone: true
})
export class GeneralPipe implements PipeTransform {

    constructor(private databaseService: DatabaseService) { }

    transform(value: any, args: string, property?: string): Promise<any> {
        return this.databaseService.getData(args, value).then((result: any) => {
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
