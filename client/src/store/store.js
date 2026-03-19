import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import studentReducer from './slices/studentSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    student: studentReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})