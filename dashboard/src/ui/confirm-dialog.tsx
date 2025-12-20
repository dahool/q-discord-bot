import { Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
 
interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function ConfirmDialog({open, message, onClose, onConfirm}: ConfirmDialogProps) {
 
  const closeDialog = () => {
    onClose();
  }
  const confirmDialog = () => {
    if (onConfirm) onConfirm();
    closeDialog();
  }

  return (
    <>
      {/* there no much information about the handler prop, but is required. it doesn't seems to do anything */}
      <Modal show={open} size="md" onClose={closeDialog} popup>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">{message}</h3>
            <div className="flex justify-center gap-4">
              <Button color="gray" onClick={closeDialog}>Cancel</Button>
              <Button color="failure" onClick={confirmDialog}>Confirm</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}