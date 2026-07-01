import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { EventSchedule, Role, Server, Zone } from "../../app/models";
import { ApiResponse, deleteEvent, getServer, listEvents, listRoles, listServers, listZones, updateEvent } from '@/lib/server/api';
import { RankEntry, retrieveRanks } from './db'
import { DateTime } from 'luxon'

export const serverQuery = createApi({
    reducerPath: 'serverApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    endpoints: (build) => ({
        getZones: build.query<Zone[], void>({
            queryFn: async () => {
                try {
                    const r = await listZones()
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            }
        }),
        getRoles: build.query<Role[], string>({
            queryFn: async(serverId) => {
                try {
                    const r = await listRoles(serverId)
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            }
        }),
        getServers: build.query<Server[], void>({
            queryFn: async() => {
                try {
                    console.log('before query')
                    const r = await listServers()
                    return { data: r }
                } catch (e: any) {
                    console.log(e)
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            }
        }),
        getServer: build.query<Server, string>({
            queryFn: async(serverId) => {
                try {
                    const r = await getServer(serverId)
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            }
        })
    })
})

export const eventsQuery = createApi({
    reducerPath: 'eventApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    tagTypes: ['Events'],
    endpoints: (build) => ({
        getEvents: build.query<EventSchedule[], string>({
            queryFn: async(serverId) => {
                try {
                    console.log("list events")
                    const r = await listEvents(serverId)
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            },
            providesTags: ['Events']
        }),
        updateEvent: build.mutation<ApiResponse, { serverId: string; formData: any; eventId?: string }>({
            queryFn: async({ serverId, formData, eventId }) => {
                try {
                    const r = await updateEvent(serverId, formData, eventId)
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            },
            invalidatesTags: ['Events']
        }),
        deleteEvent: build.mutation<ApiResponse, { eventId: string}>({
            queryFn: async({ eventId }) => {
                try {
                    const r = await deleteEvent(eventId)
                    return { data: r }
                } catch (e: any) {
                    return {
                        error: {
                          status: e.status,
                          statusText: e.data,
                          data: e.data
                        }
                    }
                }
            },
            invalidatesTags: ['Events']
    })
    })
})

export const ranksQuery = createApi({
    reducerPath: 'ranksApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    tagTypes: ['Ranks'],
    endpoints: (build) => ({
        getRanks: build.query<RankEntry[] | null, string>({
            queryFn: async(date) => {
                try {
                    return {data: await retrieveRanks(date) };
                } catch (e: any) {
                    console.error(e);
                    return {data: null}
                }
            }
        })
    })
})

export const { useGetZonesQuery, useGetRolesQuery, useGetServersQuery, useGetServerQuery } = serverQuery
export const { useGetEventsQuery, useDeleteEventMutation, useUpdateEventMutation } = eventsQuery
export const { useGetRanksQuery } = ranksQuery