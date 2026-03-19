import api from './api'

const reportService = {
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard')
    return response.data
  },

  generateStudentReport: async (payload = {}) => {
    const response = await api.post('/reports/students', payload, {
      responseType: payload.format ? 'blob' : 'json'
    })
    return response.data
  },

  generateExamReport: async (payload = {}) => {
    const response = await api.post('/reports/exams', payload, {
      responseType: payload.format ? 'blob' : 'json'
    })
    return response.data
  },

  generateResultReport: async (payload = {}) => {
    const response = await api.post('/reports/results', payload, {
      responseType: payload.format ? 'blob' : 'json'
    })
    return response.data
  },

  exportAllData: async () => {
    const response = await api.get('/reports/export-all', {
      responseType: 'blob'
    })
    return response.data
  }
}

export default reportService
