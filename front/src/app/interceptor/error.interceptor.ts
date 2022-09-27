import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { AlertService } from '../alerts';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private alerts: AlertService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      let error;
      console.error(err);
      if (err.status == 403) {
        window.location.replace(err.error.redirect);
      } else {
        if (err.error) {
          error = err.error.message;
        } else if (err.message) {
          error = err.message;
        } else {
          error = err.statusText;
        }
        this.alerts.error(error, {timeout: 10000, dismissOnNavigate: false});
      }
      return throwError(err);
    }));
  }

}