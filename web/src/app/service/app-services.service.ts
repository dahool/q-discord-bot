import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { Channel, Config, Role, SaveResponse, Server, User, UserServer } from './models';

const API_URL = '';

@Injectable({
  providedIn: 'root'
})
export class AppService extends BaseService {

  constructor(spinner: NgxSpinnerService, http: HttpClient) { 
    super(spinner, http, API_URL);
  }

  listServers(): Observable<UserServer[]> {
    return this.executeGet('servers');
  } 
 
  listChannels(id: string): Observable<Channel[]> {
    return this.executeGet('channels/' + id);
  }

  listRoles(id: string): Observable<Role[]> {
    return this.executeGet('roles/' + id);
  }

  getServer(id: string): Observable<Server> {
    return this.executeGet('server/' + id);
  }

  getConfig(server: string): Observable<Config> {
    return this.executeGet('config/' + server);
  }

  saveConfig(server: string, data: Config):  Observable<SaveResponse> {
    return this.executePut('config/' + server, data);
  }

  getProfile(): Observable<User> {
    return this.executeGet('user');
  }

}