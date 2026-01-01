import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private readonly http = inject(HttpService);

  getCategories<T = unknown>(): Observable<T> {
    return this.http.get('/market/categories');
  }

  getSubCategories<T = unknown>(): Observable<T> {
    return this.http.get('/market/sub_categories');
  }

  getBrands<T = unknown>(): Observable<T> {
    return this.http.get('/market/brands');
  }

  getSuppliers<T = unknown>(): Observable<T> {
    return this.http.get('/market/suppliers');
  }

  getProducers<T = unknown>(): Observable<T> {
    return this.http.get('/market/producers');
  }
}

