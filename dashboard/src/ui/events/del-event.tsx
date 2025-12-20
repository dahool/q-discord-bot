import { FaTrashAlt } from "react-icons/fa";
import { Button, Spinner } from "flowbite-react";
import { useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import { toast } from "react-toastify";
import { useDeleteEventMutation } from "../../lib/server/query";

export function DeleteEvent({ id, editable }: { serverId: string, id: string, editable: boolean }) {

    const [ deleteServerEvent ] = useDeleteEventMutation();
    const [dialogState, setDialogState] = useState(false);
    const [spinner, setSpinner] = useState(false);

    if (!editable) {
      return (<></>)
    }

    const confirmDelete = () => {
      setDialogState(true);
    }
    const onConfirm = async () => {
      setSpinner(true);
      try {
        const r = await deleteServerEvent({ eventId: id }).unwrap();
        if (r.status) {
          toast.success('Event removed');
        } else {
          toast.error(r.message);
        }
      } finally {
        setSpinner(false);
      }
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