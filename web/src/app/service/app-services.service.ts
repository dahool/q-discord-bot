import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { Channel, Config, Guild, Role, SaveResponse, Schedule, Territory, User, UserServer } from './models';

const API_URL = '';

@Injectable({
  providedIn: 'root'
})
export class AppService extends BaseService {

  constructor(spinner: NgxSpinnerService, http: HttpClient) { 
    super(spinner, http, API_URL);
  }

  listServers(): Observable<UserServer[]> {
    return this.executeGet('servers')
  } 
 
  listChannels(id: string): Observable<Channel[]> {
    return this.executeGet('channels/' + id);
  }

  listRoles(id: string): Observable<Role[]> {
    return this.executeGet('roles/' + id);
  }

  getEvents(id: string): Observable<Schedule[]> {
    return this.executeGet('events/' + id).pipe(map(v => v.map((vin: any) => this.parseDate(vin, 'dtStart', 'dtEnd'))))
  }

  getServer(id: string): Observable<Guild> {
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

  listZones(): Observable<Territory[]> {
    return this.executeGet('zones').pipe(map(v => v.map((vin: any) => this.parseDate(vin, 'next'))))    
  }
  
  saveNewEvent(guild: string, data: any): Observable<SaveResponse> {
    return this.executePost('newEvent/' + guild, data);
  }
  
  updateEvent(id: string, data: any): Observable<SaveResponse> {
    return this.executePut('event/' + id, data);
  }

  deleteEvent(id: string): Observable<SaveResponse> {
    return this.executeDelete('event', id);
  }

}