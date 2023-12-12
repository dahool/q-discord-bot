import { cleanUpCalendar, postDailyEvents, processAnnouncements, rolloutEvents, scheduleDiscordEvents } from "@/cron/notification"
import { cleanupTempRoles } from "@/listeners"
import { loadCalendarEvents } from "./calendar"
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
    cleanupTempRoles
]

export const MID_DAILY_TASKS = [
    postDailyEvents
]