import { DateTime } from "luxon";

export const GROUP_DATE_FORMAT = {
  month: "long",
  weekday: "long",
  day: "numeric"
} satisfies Intl.DateTimeFormatOptions;

export const EVENT_TIME_SHORT_FORMAT = {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    //timeZoneName: "short",
} satisfies Intl.DateTimeFormatOptions;

//export const WEEK_FORMAT = {...DateTime.TIME_24_SIMPLE, weekday: "long" } satisfies Intl.DateTimeFormatOptions;
export const WEEK_FORMAT = {...DateTime.DATETIME_MED_WITH_WEEKDAY, year: undefined, hour12: false } satisfies Intl.DateTimeFormatOptions;