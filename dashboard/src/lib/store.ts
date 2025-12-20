import { type Action, configureStore, type ThunkAction } from '@reduxjs/toolkit'
import { eventsQuery, serverQuery, userQuery } from './server/query'

export const makeStore = () => {
  return configureStore({
    reducer: {
      [serverQuery.reducerPath]: serverQuery.reducer,
      [eventsQuery.reducerPath]: eventsQuery.reducer,
      [userQuery.reducerPath]: userQuery.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(serverQuery.middleware)
        .concat(eventsQuery.middleware)
        .concat(userQuery.middleware)
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>