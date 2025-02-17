"use client"
import { DeleteEvent } from "./del-event";
import { FaLocationDot } from "react-icons/fa6";
import { MdEventRepeat } from "react-icons/md";
import { EventSchedule } from "@/app/models";
import { EVENT_TIME_SHORT_FORMAT } from "@/app/dateformat";
import { DateTime } from "luxon";
import { Button } from "flowbite-react";
import { FaPencilAlt } from "react-icons/fa";

export default function EventCard({ event, onEdit }: { event: EventSchedule, onEdit: (e: EventSchedule) => void }) {
  return (
      <div className="p-2 w-full">
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-[15%_70%_10%] gap-1 border-gray-300 mb-2 p-2">
            <div className="text-center"><RenderISODate value={event.dtStart}/> - <RenderISODate value={event.dtEnd}/></div>
            <div className="font-bold">{event.summary}</div>
            <div className="text-right">
              {
                event.src == undefined ?
                  <Button color="warning" title="Edit" aria-label="Edit" onClick={() => onEdit(event)}>
                    <FaPencilAlt className="h-4 w-4"/>
                  </Button>
                  : <></>
              }
            </div>
            <div className="flex justify-center items-center h-full"><RepeteableFlag show={event.recurrent} /> </div>
            <div className="inline-flex items-center"><FaLocationDot className="h-3 w-3"/><span className="ml-2">{event.location}</span></div>
            <div className="text-right"><DeleteEvent serverId={event.guild} id={event.id} editable={(event.src == undefined)}/></div>
          </div>
        </div>
      </div>
  );
}

function RepeteableFlag({ show }: { show: boolean }) {
  if (!show) return (<></>)
  return ( <MdEventRepeat className="h-4 w-4 text-blue-500" title="Repeat"/> )
}

function RenderISODate({ value }: { value: string}) {
  return (
    <>
    {DateTime.fromISO(value).toLocaleString(EVENT_TIME_SHORT_FORMAT)}
    </>
  )
}