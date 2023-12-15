import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppService } from './app-services.service';
import { UserServer } from './models';

@Injectable({
  providedIn: 'root'
})
export class CachedAppService {

  listServersSubject?: BehaviorSubject<UserServer[]>;

  constructor(private service: AppService) {}

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