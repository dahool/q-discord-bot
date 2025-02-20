'use server'
import { EventSchedule, Role, Server, Zone } from "@/app/models"
import { auth } from "@/auth"
import axios, { AxiosInstance } from "axios"
import { API_ROOT } from "@/app/env"

export interface ApiResponse {
    status: boolean;
    message: string;
}

export interface ApiFetchError {
    data: string,
    status: string
}

const axiosClient: AxiosInstance = axios.create({
    baseURL: `${API_ROOT}/api/`,
    headers: {'Content-Type': 'application/json'},
    responseType: 'json'
})

function handle_error(error: any) {
    if (error.response) {
        throw { data: error.response.data, status: error.response.status }
    } else if (error.message) {
        throw { data: error.message, status: 0 }
    } else {
        throw { data: 'Error', status: 0 }
    }
}

async function _request(method: "post" | "put" | "get" | "delete", url: string, payload?: any): Promise<any> {
    const session = await auth();
    try {
        const response = await axiosClient.request({url: url, method: method, data: payload, headers: {Authorization: `Bearer ${session?.access_token}`}})
        return response
    } catch (error: any) {
        handle_error(error)
    }
}

export async function _get(url: string): Promise<any> {
    return _request('get', url)
}

export async function listServers(): Promise<Server[]> {
    return (await _get('servers')).data
}

export async function getServer(id: string): Promise<Server> {
    return (await _get(`server/${id}`)).data
}

export async function listEvents(id: string): Promise<EventSchedule[]> {
    return (await _get(`events/${id}`)).data;
}

export async function listRoles(id: string): Promise<Role[]> {
    return (await _get(`roles/${id}`)).data;
}

export async function listZones(): Promise<Zone[]> {
    return (await _get('zones')).data;
}

export async function updateEvent(serverId: string, payload: EventSchedule, eventId?: string): Promise<ApiResponse> {
    if (eventId) {
        return (await _request('put', `event/${eventId}`, payload)).data;
    }
    return (await _request('post', `newEvent/${serverId}`, payload)).data;
}

export async function deleteEvent(eventId: string): Promise<ApiResponse> {
    return (await _request('delete', `event/${eventId}`)).data;
}

