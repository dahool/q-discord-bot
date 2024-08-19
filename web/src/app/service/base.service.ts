import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DateTime } from 'luxon';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const useCredentials = environment.production;

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  }),
  withCredentials: useCredentials
}

export const ROOT_API = environment.hostUrl;

export function parseDate(data: any, ...properties: string[]): any {
  properties.forEach(name => {
    let value = data[name];
    if (value != undefined && value != null && value != '') {
      data[name] = DateTime.fromISO(value);
    }
  })
  return data;
}

export abstract class BaseService {

  private spinnerStack: boolean[] = [];

  constructor(protected spinner: NgxSpinnerService,
    protected http: HttpClient,
    protected servicePath: string) { }

  protected attachSpinner(ob: Observable<any>): Observable<any> {
    this.spinnerStack.push(true);
    this.spinner.show();
    return ob.pipe(map(v => {
      console.debug("RESPONSE: " + JSON.stringify(v));
      return v;
    })).pipe(finalize(() => {
      this.spinnerStack.pop();
      if (this.spinnerStack.length == 0) {
        this.spinner.hide();
      }
    }))
  }

  protected executePost(url: string, input: any): Observable<any> {
    console.debug('POST /' + url + ': ' + JSON.stringify(input));
    let ob = this.http.post(ROOT_API + this.servicePath + url, input, httpOptions);
    return this.attachSpinner(ob);
  }

  protected executePut(url: string, input: any): Observable<any> {
    console.debug('PUT /' + url + ': ' + JSON.stringify(input));
    let ob = this.http.put(ROOT_API + this.servicePath + url, input, httpOptions);
    return this.attachSpinner(ob);
  }

  protected executeGetById(url: string, id: any, params?: any): Observable<any> {
    return this.executeGet(url + '/' + id, params);
  }

  protected executeGet(url: string, params?: any, silent: boolean = false): Observable<any> {
    console.debug('GET /' + url + ': ' + (params || ''));
    let ob: any;
    if (params) {
      ob = this.http.get(ROOT_API + this.servicePath + url, { params: params, withCredentials: useCredentials});
    } else {
      ob = this.http.get(ROOT_API + this.servicePath + url, httpOptions);
    }
    if (silent) {
      return ob;
    }
    return this.attachSpinner(ob);
  }

  protected executeDelete(url: string, id: any, params?: any): Observable<any> {
    let idUrl = url + '/' + id;
    console.debug('DELETE /' + idUrl + ': ' + (params || ''));
    let ob: any;
    if (params) {
      ob = this.http.delete(ROOT_API + this.servicePath + idUrl, { params: params, withCredentials: useCredentials});
    } else {
      ob = this.http.delete(ROOT_API + this.servicePath + idUrl, httpOptions);
    }
    return this.attachSpinner(ob);
  }

}
