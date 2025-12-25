import { Pipe, PipeTransform, inject } from '@angular/core';
import { MainService } from '../services/main.service';

@Pipe({
  name: 'general',
  standalone: true
})

export class GeneralPipe implements PipeTransform {
  private mainService = inject(MainService);

  constructor() {

  }

  transform(value: any, args: string, property?: string): any {
    return this.mainService.getData(args, value).then((result) => {
      if (property) {
        return result[property];
      } else {
        return result.name;
      }
    }).catch((err) => {
      return value;
    });
  }

}
