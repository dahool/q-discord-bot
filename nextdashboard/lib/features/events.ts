import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EventSchedule } from '@/app/models'
import { AppThunk } from '../store'
import { listEvents } from '../server/api'

interface EventsState {
    value: EventSchedule[]
}

const initialState: EventsState = {
    value: []
}

export const eventsSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        setEvents: (state, action: PayloadAction<EventSchedule[]>) => {
            state.value = action.payload
        }
    }
})

export const { setEvents } = eventsSlice.actions

export const loadEvents = (server: string): AppThunk => async dispatch => {
    const list = await listEvents(server);
    dispatch(setEvents(list));
}
export default eventsSlice.reducer