import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('token')
const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
})()
const storedUserType = localStorage.getItem('userType')

const initialState = {
  user: storedUser,
  token,
  isAuthenticated: !!(token && storedUser && storedUserType),
  userType: storedUserType,
  loading: false,
  error: null,
  // authChecked: true means we know the auth state (no pending API validation needed)
  authChecked: !token // if no token exists, no need to call /auth/me
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.authChecked = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.userType = action.payload.userType
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('userType', action.payload.userType)
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.userType = null
      state.authChecked = true
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userType')
    },
    setAuthChecked: (state) => {
      state.authChecked = true
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  updateUser,
  clearError,
  setAuthChecked
} = authSlice.actions

export default authSlice.reducer