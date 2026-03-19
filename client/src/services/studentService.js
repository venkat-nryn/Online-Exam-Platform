import api from './api'

const studentService = {
  // Get all students
  getAllStudents: async () => {
    const response = await api.get('/students')
    return response.data
  },

  // Get students by group
  getStudentsByGroup: async (groupId) => {
    const response = await api.get(`/students/group/${groupId}`)
    return response.data
  },

  // Get single student
  getStudent: async (studentId) => {
    const response = await api.get(`/students/${studentId}`)
    return response.data
  },

  // Create student
  createStudent: async (studentData) => {
    const response = await api.post('/students', studentData)
    return response.data
  },

  // Update student
  updateStudent: async (studentId, studentData) => {
    const response = await api.put(`/students/${studentId}`, studentData)
    return response.data
  },

  // Delete student
  deleteStudent: async (studentId) => {
    const response = await api.delete(`/students/${studentId}`)
    return response.data
  },

  // Toggle student status
  toggleStudentStatus: async (studentId) => {
    const response = await api.patch(`/students/${studentId}/toggle-status`)
    return response.data
  },

  // Search students
  searchStudents: async (query) => {
    const response = await api.get(`/students/search?query=${query}`)
    return response.data
  },

  // Bulk create students
  bulkCreateStudents: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/students/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

export default studentService