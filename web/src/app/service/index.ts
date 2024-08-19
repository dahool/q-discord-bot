import { Observable } from 'rxjs';
import { Channel, Config, Guild, Role, SaveResponse, Schedule, Territory, User, UserServer } from './models';
import { InjectionToken } from '@angular/core';

export const APP_SERVICE = new InjectionToken<IAppService>('IAppService');

export interface IAppService {

  listServers(): Observable<UserServer[]>;

  listChannels(id: string): Observable<Channel[]>;

  listRoles(id: string): Observable<Role[]>;

  getEvents(id: string): Observable<Schedule[]>;

  getServer(id: string): Observable<Guild>;

  getConfig(server: string): Observable<Config>;

  saveConfig(server: string, data: Config):  Observable<SaveResponse>;

  getProfile(): Observable<User>;

  listZones(): Observable<Territory[]>;

  saveNewEvent(guild: string, data: any): Observable<SaveResponse>;

  updateEvent(id: string, data: any): Observable<SaveResponse>;

  deleteEvent(id: string): Observable<SaveResponse>;

  getPlayerInfoVersions(): Observable<any>;

  getPlayerInfoTags(): Observable<any>;

  getPlayerList(query: any): Observable<any[]>;

}
