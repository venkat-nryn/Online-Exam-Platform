import api from './api'

const resultService = {
  // Get all results (admin)
  getAllResults: async () => {
    const response = await api.get('/results')
    return response.data
  },

  // Get results by exam (admin)
  getResultsByExam: async (examId) => {
    const response = await api.get(`/results/exam/${examId}`)
    return response.data
  },

  // Get student results
  getStudentResults: async (studentId) => {
    const response = await api.get(`/results/student/${studentId}`)
    return response.data
  },

  // Get specific exam result for student
  getStudentExamResult: async (studentId, examId) => {
    const response = await api.get(`/results/student/${studentId}/exam/${examId}`)
    return response.data
  },

  // Update result marks (admin)
  updateResultMarks: async (resultId, marksData) => {
    const response = await api.put(`/results/${resultId}`, marksData)
    return response.data
  },

  // Publish results (admin)
  publishResults: async (examId) => {
    const response = await api.put(`/results/publish/${examId}`)
    return response.data
  },

  // Unpublish results (admin)
  unpublishResults: async (examId) => {
    const response = await api.put(`/results/unpublish/${examId}`)
    return response.data
  },

  // Get result analytics (admin)
  getResultAnalytics: async (examId) => {
    const response = await api.get(`/results/analytics/${examId}`)
    return response.data
  },

  // Download result report (admin)
  downloadResultReport: async (examId, format = 'csv') => {
    const response = await api.get(`/results/download/${examId}?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default resultService