"use server";
import { cache } from 'react'
import { EventSchedule, Server, Zone } from "../models";
import { auth } from "@/auth";

import ServerApi from "./api";

const serverApi = new ServerApi();

export async function fetchUser(): Promise<any> {
  const session = await auth();
  return session?.user;
}

export async function fetchZoneList(): Promise<Zone[]> {
  return serverApi.listZones();
}

export async function fetchServers(): Promise<Server[]> {
  return serverApi.listServers();
}
/*
export async function fetchServerById(id: string) {
  return serverApi.getServer(id);
}
*/
export const fetchServerById = cache(async (id: string) => {
  return serverApi.getServer(id);
})

export async function fetchServerEvents(id: string): Promise<EventSchedule[]> {
  return serverApi.listEvents(id);
}

export async function fetchServerRoles(id: string) {
  return serverApi.listRoles(id);
}
