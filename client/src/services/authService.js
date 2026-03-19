import api from './api'

const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData)
    return response.data
  },

  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token')
  }
}

export default authService