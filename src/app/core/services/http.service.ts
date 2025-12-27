import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private http = inject(HttpClient);
  private mainService = inject(MainService);

  headers!: HttpHeaders;
  baseUrl: string;
  store_id!: string;

  constructor() {
    // Modern HttpClient kullanıyor, Headers artık HttpHeaders
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'charset': 'UTF-8'
    });

    // İş mantığı AYNEN korundu
    this.baseUrl = 'https://hq.quickly.com.tr';
    // this.baseUrl = 'http://localhost:3000';
    //this.baseUrl = 'http://192.168.0.29:3000';

    this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
      if (res && res.docs && res.docs.length > 0 && res.docs[0].value) {
        this.store_id = res.docs[0].value._id;
      }
    }).catch(err => {
      console.error('HttpService: Error loading RestaurantInfo:', err);
    });
  }

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  private _createAuthorizationHeader(headers: HttpHeaders, token?: string): HttpHeaders {
    if (token) {
      headers = headers.set('Authorization', token);
    }
    headers = headers.set('Store', this.store_id);
    return headers;
  }

  get(url: string, token?: string): Observable<any> {
    const headers = this._createAuthorizationHeader(this.headers, token);
    return this.http.get(this.baseUrl + url, { headers });
  }

  post(url: string, data: any, token?: string): Observable<any> {
    const headers = this._createAuthorizationHeader(this.headers, token);
    return this.http.post(this.baseUrl + url, data, { headers });
  }

  put(url: string, data: any, token?: string): Observable<any> {
    const headers = this._createAuthorizationHeader(this.headers, token);
    return this.http.put(this.baseUrl + url, data, { headers });
  }

  delete(url: string, token?: string): Observable<any> {
    const headers = this._createAuthorizationHeader(this.headers, token);
    return this.http.delete(this.baseUrl + url, { headers });
  }
}
