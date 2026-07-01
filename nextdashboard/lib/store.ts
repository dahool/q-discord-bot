import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit'
import eventsReducer from './features/events'
import { eventsQuery, ranksQuery, serverQuery } from './server/query'

export const makeStore = () => {
  return configureStore({
    reducer: {
      events: eventsReducer,
      [serverQuery.reducerPath]: serverQuery.reducer,
      [eventsQuery.reducerPath]: eventsQuery.reducer,
      [ranksQuery.reducerPath]: ranksQuery.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(serverQuery.middleware)
        .concat(eventsQuery.middleware)
        .concat(ranksQuery.middleware)
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>