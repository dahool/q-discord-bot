"use server"
import { z } from 'zod';
import { deleteEvent, updateEvent } from '@/lib/server/api';
import { auth } from '@/auth';

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

export async function fetchUser(): Promise<any> {
  const session = await auth();
  return session?.user;
}

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
        return await updateEvent(serverId, formData, eventId);
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
        return await deleteEvent(eventId);
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
