"use client"
import { DateTime, DateTimeFormatOptions } from "luxon";
export default function RenderLocalTime({ date, format }: { date: string | null, format: DateTimeFormatOptions}) {
    const dt = DateTime.fromISO(date as string);
    return (
        <>
        {dt.toLocaleString(format)}
        </>
    )
}