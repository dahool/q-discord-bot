import { Injectable } from "@angular/core";
import { Guild } from "./models";


@Injectable({
  providedIn: 'root'
})
export class LocalService {

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
    } else {
      sessionStorage.setItem('server', JSON.stringify(server));
    }
  }

}