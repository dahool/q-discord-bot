"use client"
import { FaPlusCircle } from "react-icons/fa";
import { Button } from "flowbite-react";
import { useState } from "react";
import EventForm from "./event-form";
import { Server } from "@/app/models";

export function AddEvent({server}: {server: Server}) {

    const onCloseModal = () => {
      setOpenModal(false);
    }

    const [openModal, setOpenModal] = useState(false);

    return (
      <>
      <Button color="blue" title="Add" aria-label="Add" onClick={() => setOpenModal(true)}>
          <FaPlusCircle className="h-4 w-4"/>
      </Button>
      <EventForm serverId={server.id} openModal={openModal} onClose={onCloseModal}/>
      </>
    );
  }