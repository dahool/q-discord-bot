import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Guild } from "./models";


@Injectable({
  providedIn: 'root'
})
export class LocalService {

  serverSubject = new BehaviorSubject<any>(undefined);

  constructor() {
    this.serverSubject.next(this.getServer());
  }

  getServer(): Guild | undefined {
    let v = sessionStorage.getItem('server');
    if (v) {
      return JSON.parse(v);
    }
    return undefined;
  }

  setServer(server: Guild | null) {
    if (server == null) {
      sessionStorage.removeItem('server');
      this.serverSubject.next(null);
    } else {
      sessionStorage.setItem('server', JSON.stringify(server));
      this.serverSubject.next(server);
    }
  }

  getServerSubject(): BehaviorSubject<Guild> {
    return this.serverSubject;
  }
  
}