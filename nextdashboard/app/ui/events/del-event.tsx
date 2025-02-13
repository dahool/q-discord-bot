"use client"
import { FaTrashAlt } from "react-icons/fa";
import { Button, Spinner } from "flowbite-react";
import { useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import { removeEvent } from "@/app/services/actions";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/lib/hooks";
import { loadEvents } from '@/lib/features/events';


export function DeleteEvent({ serverId, id, editable }: { serverId: string, id: string, editable: boolean }) {

    const dispatch = useAppDispatch();
    const [dialogState, setDialogState] = useState(false);
    const [spinner, setSpinner] = useState(false);

    if (!editable) {
      return (<></>)
    }

    const deleteServerEvent = removeEvent.bind(null, id);

    const confirmDelete = () => {
      setDialogState(true);
    }
    const onConfirm = async () => {
      setSpinner(true);
      const r = await deleteServerEvent();
      if (r.status) {
        dispatch(loadEvents(serverId));
        toast.success('Event removed');
      } else {
        toast.error(r.message);
      }
      setSpinner(false);
    }

    if (spinner) return (
      <div className="flex flex-wrap gap-2"><div className="text-left ml-[15px]"><Spinner color="failure"/></div></div>
    )
    else
      return (
        <>
        <ConfirmDialog open={dialogState} message={`Remove this event?`} key={id} onClose={() => setDialogState(false) } onConfirm={onConfirm} />
        <Button color="failure" title="Delete" aria-label="Delete" onClick={confirmDelete}>
            <FaTrashAlt className="h-4 w-4"/>
        </Button>
        </>
      );
  }