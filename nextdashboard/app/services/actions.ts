"use server"
import { z } from 'zod';
import ServerApi from './api';
import { signOut } from 'next-auth/react';

const FormSchema = z.object({
    zone: z.string().nonempty(),
    next: z.string().nonempty(),
    title: z.string().nonempty(),
    recurrent: z.boolean().optional(),
    ping: z.string().array().optional()
})

export interface ServerAction {
    errors?: any;
    message?: string;
    status?: boolean;
}

const serverApi = new ServerApi();

export async function saveEvent(serverId: string, eventId: string | undefined, formData: any): Promise<ServerAction> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(formData);
    const fields = FormSchema.safeParse(formData);
    if (!fields.success) {
        return {
            errors: fields.error.flatten().fieldErrors,
            message: 'Missing fields'
        }
    }
    try {
        return await serverApi.updateEvent(serverId, eventId, formData);
    } catch (e: unknown) {
        console.log(e);
        let message = 'Error';
        if (typeof e === "string") {
            message = e;
        } else if (e instanceof Error) {
            message = e.message
        }
        return {status: false, message: message}
    }

}

export async function removeEvent(eventId: string) {
    try {
        return await serverApi.deleteEvent(eventId);
    } catch (e: unknown) {
        console.log(e);
        let message = 'Error';
        if (typeof e === "string") {
            message = e;
        } else if (e instanceof Error) {
            message = e.message
        }
        return {status: false, message: message}
    }
}

/*
    @Post("newEvent/:id")
    saveNewEvent(@Param("id") id: string, @Body() payload: {[key:string]: any}, @Res() res: Response) {
        const zone = Territory.findZonesByName(payload.zone);
        if (zone.length > 0) {
            TerritoryEvents.createNewEvent(id, zone[0], {
                title: payload.title,
                recurrent: payload.recurrent,
                ping: payload.ping,
                nextDt: payload.next
            }).then(e => {
                res.send({status: true})
            }).catch(e => {
                logger.error(e);
                res.send({status: false, error: e});
            })
        } else {
            res.send({status: false, error: "Zone " + payload.zone + " not found."});
        }
    }
*/