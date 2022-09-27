import { Observable, of } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Channel, Role, UserServer } from './models';

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
  
  loadConfig(server: string, configId: string): Observable<any> {
    return this.executeGet('config/' + server + '/' + configId);
  }

  saveConfig(server: string, configId: string, data: any):  Observable<any> {
    return this.executePut('config/' + server + '/' + configId, data);
  }
 
  deleteConfig(server: string, configId: string, id: string):  Observable<any> {
    return this.executeDelete('config/' + server + '/' + configId, id);
  }

  getProfile(): Observable<any> {
    return this.executeGet('user');
  }

}