import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  loading: false,
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  notifications: [],
  modalData: null
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', state.darkMode)
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      )
    },
    setModalData: (state, action) => {
      state.modalData = action.payload
    },
    clearModalData: (state) => {
      state.modalData = null
    }
  }
})

export const { 
  setLoading, 
  toggleSidebar, 
  toggleDarkMode, 
  addNotification, 
  removeNotification,
  setModalData,
  clearModalData
} = uiSlice.actions

export default uiSlice.reducer