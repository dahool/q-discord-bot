"use client";
import EventCard from "./event-card";
import { GroupBy } from "@/app/utils";
import { EventSchedule, Server } from "@/app/models";
import { DateTime } from "luxon";
import { Bebas_Neue } from "next/font/google";
import { GROUP_DATE_FORMAT } from "@/app/dateformat";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { FaPlusCircle } from "react-icons/fa";
import { useGetEventsQuery } from "@/lib/server/query";
import EventFormDialog from "./event-form";
const bebas = Bebas_Neue({ weight: "400", style: "normal", subsets: ["latin"] });

function groupEvents(agenda: EventSchedule[]): Map<DateTime, EventSchedule[]> {
  // @ts-ignore */}
  return GroupBy(agenda,
    (item: EventSchedule) => DateTime.fromISO(item.dtStart).startOf('day'),
    (a: DateTime, b: DateTime) => a.equals(b));
}

export default function EventList({ server }: { server: Server }) {

  const [eventGroups, setEventGroups] = useState<Map<DateTime, EventSchedule[]> | null>(null)
  const [openForm, setOpenForm] = useState<boolean>(false)
  const [formEvent, setFormEvent] = useState<EventSchedule | undefined>(undefined)
  const { data: eventList } = useGetEventsQuery(server.id)

  useEffect(() => {
    console.log("group events")
    if (!eventList) return;
    const groupedEvents = groupEvents(eventList);
    setEventGroups(groupedEvents);
  }, [eventList])

  const showForm = (event: EventSchedule | undefined = undefined) => {
    setFormEvent(event)
    setOpenForm(true)
  }

  if (!eventGroups) return EventListLoader();

  return (
    <>
      <EventFormDialog serverId={server.id} event={formEvent} show={openForm} onClose={() => setOpenForm(false)}/>
      <div className="m-4 flex justify-end">
        <Button color="blue" title="Add" aria-label="Add" onClick={() => showForm()}>
            <FaPlusCircle className="h-4 w-4"/>
        </Button>
      </div>
      {
      [...eventGroups.entries()].map(
        ([date, events]: [DateTime, EventSchedule[]], index) => {
          return (
            <div className="grid grid-rows bg-gray-50 border border-gray-100 rounded-2xl card-color mb-2" key={index}>
              <div className="m-2 flex justify-center">
                <span className={bebas.className}>{date.toLocaleString(GROUP_DATE_FORMAT)}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {
                  events.map((e: EventSchedule) => <EventCard event={e} key={e._id} onEdit={showForm}/>)
                }
              </div>
            </div>
          )
        }
      )
      }
    </>
  );
}

export const EventListLoader = () => {
  return (
    <div className="p-6 md:overflow-y-auto md:p-12">
      <div className="grid grid-rows bg-gray-50 border border-gray-100 rounded-2xl card-color animate-pulse">
        <div className="m-2 flex justify-center">
          <span className="bg-gray-200 h-6 w-48 block rounded"></span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-2 w-full">
              <div className="border-t border-gray-200">
                <div className="grid grid-cols-[15%_70%_10%] gap-1 border-b-2 border-gray-300 mb-2 p-2">
                  <div className="bg-gray-200 h-4 w-20 block rounded"></div>
                  <div className="bg-gray-200 h-4 w-40 block rounded"></div>
                  <div className="bg-gray-200 h-4 w-10 block rounded"></div>
                  <div className="bg-gray-200 h-4 w-6 block rounded"></div>
                  <div className="bg-gray-200 h-4 w-16 block rounded"></div>
                  <div className="bg-gray-200 h-4 w-8 block rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
