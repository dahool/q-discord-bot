"use client"
import { FaPencilAlt } from "react-icons/fa";
import { Button } from "flowbite-react";
import { useState } from "react";
import EventForm from "./event-form";
import { EventSchedule } from "@/app/models";

export function EditEvent({ serverId, id, event, editable }: { serverId: string, id: string, event: EventSchedule, editable: boolean }) {

    const [openModal, setOpenModal] = useState(false);

    if (!editable) {
      return (<></>)
    }

    const onCloseModal = () => {
      setOpenModal(false);
    }

    return (
      <>
      <Button color="warning" title="Edit" aria-label="Edit" onClick={() => setOpenModal(true)}>
          <FaPencilAlt className="h-4 w-4"/>
      </Button>
      <EventForm serverId={serverId} id={id} openModal={openModal} data={event} onClose={onCloseModal}/>
      </>
    );
  }