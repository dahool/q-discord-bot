import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserServer } from './models';
import { APP_SERVICE, IAppService } from '.';

@Injectable({
  providedIn: 'root'
})
export class CachedAppService {

  listServersSubject?: BehaviorSubject<UserServer[]>;

  constructor(@Inject(APP_SERVICE) private service: IAppService) {}

  listServers():  BehaviorSubject<UserServer[]> {
    let stored = sessionStorage.getItem('server-list');
    if (stored) {
      if (this.listServersSubject == undefined) this.listServersSubject = new BehaviorSubject<UserServer[]>([])
      this.listServersSubject.next(JSON.parse(stored));
    } else if (this.listServersSubject == undefined) {
      this.listServersSubject = new BehaviorSubject<UserServer[]>([])
      this.service.listServers().subscribe(l => {
        sessionStorage.setItem('server-list', JSON.stringify(l));
        this.listServersSubject!.next(l);
      })
    }
    return this.listServersSubject;
  }

}
