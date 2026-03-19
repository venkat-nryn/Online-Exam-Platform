import api from './api'

const examService = {
  // Admin: Get all exams
  getAllExams: async () => {
    const response = await api.get('/exams')
    return response.data
  },

  // Admin: Get single exam
  getExam: async (examId) => {
    const response = await api.get(`/exams/${examId}`)
    return response.data
  },

  // Admin: Create exam
  createExam: async (examData) => {
    const response = await api.post('/exams', examData)
    return response.data
  },

  // Admin: Update exam
  updateExam: async (examId, examData) => {
    const response = await api.put(`/exams/${examId}`, examData)
    return response.data
  },

  // Admin: Delete exam
  deleteExam: async (examId) => {
    const response = await api.delete(`/exams/${examId}`)
    return response.data
  },

  // Admin: Add questions manually
  addQuestions: async (examId, questions) => {
    const response = await api.post(`/exams/${examId}/questions`, { questions })
    return response.data
  },

  // Admin: Upload questions via Excel
  uploadQuestions: async (examId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/exams/${examId}/questions/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Admin: Assign exam
  assignExam: async (assignmentData) => {
    const response = await api.post('/exams/assign', assignmentData)
    return response.data
  },

  // Admin: Monitor exam
  monitorExam: async (examId) => {
    const response = await api.get(`/exams/${examId}/monitor`)
    return response.data
  },

  // Student: Get my exams
  getMyExams: async () => {
    const response = await api.get('/exams/student/my-exams')
    return response.data
  },

  // Student: Start exam
  startExam: async (examId) => {
    const response = await api.post(`/exams/${examId}/start`)
    return response.data
  },

  // Student: Save answer
  saveAnswer: async (examId, questionId, answer) => {
    const response = await api.post(`/exams/${examId}/save-answer`, { questionId, answer })
    return response.data
  },

  // Student: Mark question visited
  markVisited: async (examId, questionId) => {
    const response = await api.post(`/exams/${examId}/mark-visited`, { questionId })
    return response.data
  },

  // Student: Submit exam
  submitExam: async (examId) => {
    const response = await api.post(`/exams/${examId}/submit`)
    return response.data
  },

  // Student: Report violation
  reportViolation: async (examId, type, details) => {
    const response = await api.post(`/exams/${examId}/violation`, { type, details })
    return response.data
  }
}

export default examService