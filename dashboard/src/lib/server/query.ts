import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type ApiResponse } from "./api";
import { API_ROOT } from "../../env";
import type { FormValues } from "../../ui/events/event-form";
import type { EventSchedule, Role, Server, Zone } from "../../models";

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_ROOT}/api/`,
  credentials: 'include',
})

const baseQueryWithRedirect: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 403) {
    const redirect = (result.error.data as any)?.redirect
    if (redirect) {
      window.location.replace(redirect)
    }
  }

  return result
}

export const serverQuery = createApi({
  reducerPath: "serverApi",
  baseQuery: baseQueryWithRedirect,
  endpoints: (build) => ({
    getZones: build.query<Zone[], void>({
      query: () => "zones",
    }),
    getRoles: build.query<Role[], string>({
      query: (serverId) => `roles/${serverId}`,
    }),
    getServers: build.query<Server[], void>({
      query: () => "servers",
    }),
    getServer: build.query<Server, string>({
      query: (serverId) => `server/${serverId}`,
    }),
  }),
});

export const eventsQuery = createApi({
  reducerPath: "eventApi",
  baseQuery: baseQueryWithRedirect,
  tagTypes: ["Events"],
  endpoints: (build) => ({
    getEvents: build.query<EventSchedule[], string>({
      query: (serverId) => `events/${serverId}`,
      providesTags: ["Events"],
    }),
    updateEvent: build.mutation<
      ApiResponse,
      { serverId: string; formData: FormValues; eventId?: string }
    >({
      query: ({ serverId, formData, eventId }) =>
        eventId
          ? { url: `event/${eventId}`, method: "PUT", body: formData }
          : { url: `newEvent/${serverId}`, method: "POST", body: formData },
      invalidatesTags: ["Events"],
    }),
    deleteEvent: build.mutation<ApiResponse, { eventId: string }>({
      query: ({ eventId }) => ({
        url: `event/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Events"],
    }),
  }),
});

export const userQuery = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithRedirect,
  endpoints: (build) => ({
    getUser: build.query<any, void>({
      query: () => "user",
    }),
  }),
});

export const {
  useGetZonesQuery,
  useGetRolesQuery,
  useGetServersQuery,
  useGetServerQuery,
} = serverQuery;
export const {
  useGetEventsQuery,
  useDeleteEventMutation,
  useUpdateEventMutation,
} = eventsQuery;
export const { useGetUserQuery } = userQuery;