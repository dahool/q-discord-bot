import { DateTime } from "luxon";

export interface Server {
    id: string;
    name: string;
    icon: string;
}

export interface EventSchedule {
  _id: string;
  guild: string;
  type: string;
  summary: string;
  location: string;
  duration: number;
  pingRoles: string[];
  parentId: string;
  notified: boolean;
  recurrent: boolean;
  __v: number;
  discordEventId?: string;
  id: string;
  dtStart: string;
  dtEnd: string;
  src?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Zone {
  zone: string;
  type: number;
  weekday: number;
  time: string;
  particle: string;
  rss: string[];
  paths: string[];
  next: string;
}
