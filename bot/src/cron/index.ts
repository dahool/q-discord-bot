import { cleanUpCalendar, postDailyEvents, processAnnouncements, rolloutEvents, scheduleDiscordEvents } from "@/cron/notification"
import { loadCalendarEvents } from "./calendar"
import { cleanUpPlayerInfo, cleanupTempRoles } from "./cleanup"
import { executeCrawler } from "./crawler"

export const FREQ_TASKS = [
    processAnnouncements,
    scheduleDiscordEvents,
    rolloutEvents   
]

export const DAILY_TASKS = [
    cleanUpCalendar,
    executeCrawler,
    loadCalendarEvents,
    cleanupTempRoles,
    cleanUpPlayerInfo
]

export const MID_DAILY_TASKS = [
    postDailyEvents
]