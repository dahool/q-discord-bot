import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EventSchedule } from '@/app/models'
import { AppThunk } from '../store'
import { fetchServerEvents } from '@/app/services/services'
import { parseISOdate } from '@/app/utils'

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
    //const list = (await fetchServerEvents(server)).map((e) => parseISOdate(e, "dtStart" ,"dtEnd"));
    const list = await fetchServerEvents(server);
    dispatch(setEvents(list));
}
export default eventsSlice.reducer