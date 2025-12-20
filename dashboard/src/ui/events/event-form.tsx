"use client"
import { FaForward, FaBackward, FaRotateLeft } from "react-icons/fa6"
import { FaSave } from "react-icons/fa"
import { Button, Label, Modal, TextInput, ToggleSwitch } from "flowbite-react"
import { useEffect, useState } from "react"
import Select from "@dahool/react-tailwindcss-select"
import type { SelectValue, Option } from "@dahool/react-tailwindcss-select"
import { DateTime } from "luxon"
import { toast } from "react-toastify"
import clsx from 'clsx';
import { z } from 'zod';
import type { EventSchedule } from "../../models"
import { useGetRolesQuery, useGetZonesQuery, useUpdateEventMutation } from "../../lib/server/query"
import { WEEK_FORMAT } from "../../dateformat"

const FormSchema = z.object({
    zone: z.string().nonempty(),
    next: z.string().nonempty(),
    title: z.string().nonempty(),
    recurrent: z.boolean().optional(),
    ping: z.string().array().optional()
})

export interface FormValues {
  zone?: string
  next?: string
  title?: string
  recurrent?: boolean
  ping?: string[]
}

interface EventDialogProps {
  serverId: string
  event?: EventSchedule
  show: boolean
  onClose: () => void
}

interface EventFormProps {
  serverId: string
  event?: EventSchedule
  onClose: () => void
}

const initialValue: FormValues = {
  zone: "",
  next: "",
  title: "",
  recurrent: false,
  ping: []
}

export default function EventFormDialog(props: EventDialogProps) {

  const [openModal, setOpenModal] = useState(false)

  const onCloseModal = () => {
    props.onClose()
    setOpenModal(false)
  }

  useEffect(() => {
    setOpenModal(props.show)
  }, [props.show])

  if (!openModal) {
    return (<></>)
  }

  return (
      <Modal show={openModal} size="md" onClose={onCloseModal} popup>
        <Modal.Header />
        <Modal.Body>
            <EventForm {...props} onClose={onCloseModal} />
        </Modal.Body>
      </Modal>
  )

}

export function EventForm({serverId, event, onClose}: EventFormProps) {

  const { data: zones, isFetching: isZonesPending } = useGetZonesQuery()
  const { data: roles, isFetching: isRolesPending } = useGetRolesQuery(serverId)
  const [eventData, setEventData] = useState<EventSchedule | undefined>(undefined)
  const [zoneTime, setZoneTime] = useState<string>("")
  const [formData, setFormData] = useState<FormValues>(initialValue)
  const [isSubmit, setIsSubmit] = useState(false)
  const [errors, setErrors] = useState<any>({})

  const [ saveServerEvent ] = useUpdateEventMutation();

  const handleZoneChange = (op: SelectValue) => {
    const zoneName = (op as Option).value
    const next = zones!.find((z) => z.zone == zoneName)!.next // is certain a zone exists
    setZoneTime(next)
    setFormData({ ...formData, zone: zoneName, next: next })
  }
  const onFormChange = (value: any) => {
    setFormData({ ...formData, [value.target.id]: value.target.value })
  }
  const onPingChange = (value: any) => {
    if (value != null) {
      setFormData({ ...formData, ping: value.map((v: any) => v.value) })
    } else {
      setFormData({ ...formData, ping: [] })
    }
  }
  const formSubmit = async () => {
    setIsSubmit(true)
    try {
      const fields = FormSchema.safeParse(formData);
      if (!fields.success) {
        console.log(fields)
        setErrors(fields.error.flatten().fieldErrors);
        return;
      }    
      const r = await saveServerEvent({serverId: serverId, formData: formData, eventId: event?.id }).unwrap();
      if (r.status === true) {
        toast.success('Saved')
        closeHandler()
      } else if (r.status === false) {
        toast.error(r.message)
      }
    } finally {
      setIsSubmit(false)
    }
  }
  const closeHandler = async () => {
    setFormData(initialValue)
    onClose()
  }

  useEffect(() => {
    setEventData(event)
  }, [event])

  useEffect(() => {
    if (eventData) {
      setFormData({ ...formData, title: eventData.summary, recurrent: eventData.recurrent, zone: eventData.location, next: eventData.dtStart, ping: eventData.pingRoles })
    }
  }, [eventData])

  console.log(zones)

  return (
    <form>
      <div className="space-y-6">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="zone" value="Territory" />
          </div>
          <div className={clsx({'border rounded-md invalid': errors?.zone })}>
          <Select
            isSearchable={true}
            placeholder="Territory"
            loading={isZonesPending}
            options={zones ? zones?.map((o) => {
              return { value: o.zone, label: o.zone }
            }) : []}
            onChange={handleZoneChange}
            isDisabled={event != undefined}
            value={
              formData.zone
                ? { value: formData.zone, label: formData.zone }
                : null
            }
            primaryColor="blue"
            classNames={{
              list: "h-[10rem] overflow-y-auto",
            }}
          />
          </div>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="next" value="Next Schedule" />
          </div>
          <DisplayNextTime initialValue={zoneTime} value={formData.next} onChange={(v) => setFormData({ ...formData, next: v }) }/>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch checked={formData.recurrent == true} label="Repeat" onChange={(v) => setFormData({ ...formData, recurrent: v }) } />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="title" value="Summary" />
          </div>
          <TextInput
            id="title"
            type="text"
            value={formData.title}
            onChange={onFormChange}
            required={true}
            color={errors?.title ? "failure" : undefined}
          />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="ping" value="Ping Roles" />
          </div>
          <Select
            isSearchable={false}
            isClearable={true}
            placeholder="Ping Roles"
            loading={isRolesPending}
            options={roles ? roles?.map((o) => {
              return { value: o.id, label: o.name }
            }): []}
            onChange={onPingChange}
            isMultiple={true}
            value={ formData.ping ? formData.ping.map(v => {return { value: v, label: roles?.find(r => r.id == v)?.name || '' }}) : null }
            primaryColor="blue"
            classNames={{
              list: "h-[10rem] overflow-y-auto",
            }}
          />
        </div>
        <div className="w-full flex justify-center">
          <Button onClick={formSubmit} isProcessing={isSubmit} disabled={isSubmit}><FaSave className="mr-2 h-5 w-5"/> Save</Button>
        </div>
      </div>
    </form>
  )
}

function DisplayNextTime({ value, initialValue, onChange }: { value: string | undefined, initialValue: string | undefined, onChange: (value: string) => void }) {

    const [dtvalue, setDtvalue] = useState<DateTime | null>(null)
    const [displayValue, setDisplayValue] = useState<string>("") // controlled input
    const [step, setStep] = useState(0)
    const originalValue = DateTime.fromISO(initialValue!)

    useEffect(() => {
        if (initialValue) {
            setStep(0)
            setDtvalue(DateTime.fromISO(initialValue))
        }
    }, [initialValue])

    useEffect(() => {
        if (value) setDtvalue(DateTime.fromISO(value))
    }, [value])

    useEffect(() => {
      setDisplayValue(dtvalue ? dtvalue.toLocaleString(WEEK_FORMAT) : "")
    }, [dtvalue])

    const updateTime = (up: boolean) => {
        let newValue
        if (up) {
            setStep(step+1)
            newValue = dtvalue!.plus({days: 7})
        } else {
            setStep(step-1)
            newValue = dtvalue!.minus({days: 7})
        }
        onChange(newValue.toISO()!)
    }
    const resetTime = () => {
        setStep(0)
        onChange(originalValue.toISO()!)
    }

    return (
        <>
        <TextInput id="next" type="text" value={displayValue} readOnly={true} />
        <div className="flex justify-center">
            <Button.Group>
              <Button color="gray" disabled={step == 0} onClick={() => updateTime(false)}>
                  <FaBackward className="h-4 w-4" />
              </Button>
              <Button color="gray" disabled={step == 0} onClick={ resetTime }>
                  <FaRotateLeft className="h-4 w-4" />
              </Button>
              <Button color="gray" disabled={dtvalue == null} onClick={() => updateTime(true)}>
                  <FaForward className="h-4 w-4" />
              </Button>
            </Button.Group>
        </div>
        </>
    )
}
