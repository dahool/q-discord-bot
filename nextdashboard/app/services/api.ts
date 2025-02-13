import { EventSchedule, Role, Server, Zone } from "../models";
import { auth } from "@/auth"
import { Api } from "@reduxjs/toolkit/query";
import axios, { AxiosInstance } from "axios";

export interface ApiResponse {
    status: boolean;
    message: string;
}

export default class ServerApi {

    axiosClient: AxiosInstance;

    constructor() {
        this.axiosClient = axios.create({
            baseURL: 'http://localhost:3001/api/',
            headers: {'Content-Type': 'application/json'},
            responseType: 'json'
        })
    }

    async _get(url: string): Promise<any> {
        const session = await auth();
        try {
            return this.axiosClient.get(url, {headers: {Authorization: `Bearer ${session?.access_token}`}});
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async _post(url: string, payload: any): Promise<any> {
        const session = await auth();
        try {
            return this.axiosClient.post(url, payload, {headers: {Authorization: `Bearer ${session?.access_token}`}});
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async _put(url: string, payload: any): Promise<any> {
        const session = await auth();
        try {
            return this.axiosClient.put(url, payload, {headers: {Authorization: `Bearer ${session?.access_token}`}});
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async _delete(url: string): Promise<any> {
        const session = await auth();
        try {
            return this.axiosClient.delete(url, {headers: {Authorization: `Bearer ${session?.access_token}`}});
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async listServers(): Promise<Server[]> {
        try {
            return (await this._get('servers')).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async getServer(id: string): Promise<Server> {
        try {
            return (await this._get(`server/${id}`)).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async listEvents(id: string): Promise<EventSchedule[]> {
        try {
            return (await this._get(`events/${id}`)).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async listRoles(id: string): Promise<Role[]> {
        try {
            return (await this._get(`roles/${id}`)).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async listZones(): Promise<Zone[]> {
        try {
            return (await this._get('zones')).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async updateEvent(serverId: string, eventId: string | undefined, payload: EventSchedule): Promise<ApiResponse> {
        try {
            if (eventId) {
                return (await this._put(`event/${eventId}`, payload)).data;
            }
            return (await this._post(`newEvent/${serverId}`, payload)).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

    async deleteEvent(eventId: string): Promise<ApiResponse> {
        try {
            return (await this._delete(`event/${eventId}`)).data;
        } catch (error: any) {
            if (error.response) {
                throw `Error ${error.status}`
            } else if (error.message) {
                throw `error.message`
            } else {
                throw 'Error'
            }
        }
    }

}



