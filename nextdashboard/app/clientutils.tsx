"use client"
import { DateTime } from "luxon";
import { EVENT_TIME_SHORT_FORMAT } from "./dateformat";

export function displayLocalShortTime(dt: DateTime) {
	return dt.toLocaleString(EVENT_TIME_SHORT_FORMAT);
}