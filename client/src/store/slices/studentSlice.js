import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  exams: [],
  upcomingExams: [],
  liveExams: [],
  completedExams: [],
  results: [],
  selectedExam: null,
  statistics: {
    totalExams: 0,
    averageScore: 0,
    passedExams: 0
  }
}

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setExams: (state, action) => {
      state.exams = action.payload
      
      // Categorize exams
      const now = new Date()
      state.upcomingExams = action.payload.filter(exam => exam.status === 'upcoming')
      state.liveExams = action.payload.filter(exam => exam.status === 'live')
      state.completedExams = action.payload.filter(exam => exam.status === 'completed')
    },
    setResults: (state, action) => {
      state.results = action.payload
      
      // Calculate statistics
      if (action.payload.length > 0) {
        state.statistics = {
          totalExams: action.payload.length,
          averageScore: action.payload.reduce((acc, r) => acc + r.percentage, 0) / action.payload.length,
          passedExams: action.payload.filter(r => r.isPassed).length
        }
      }
    },
    setSelectedExam: (state, action) => {
      state.selectedExam = action.payload
    },
    addExam: (state, action) => {
      state.exams.push(action.payload)
    },
    updateExam: (state, action) => {
      const index = state.exams.findIndex(e => e.id === action.payload.id)
      if (index !== -1) {
        state.exams[index] = action.payload
      }
    },
    clearStudentData: (state) => {
      state.exams = []
      state.upcomingExams = []
      state.liveExams = []
      state.completedExams = []
      state.results = []
      state.selectedExam = null
    }
  }
})

export const {
  setExams,
  setResults,
  setSelectedExam,
  addExam,
  updateExam,
  clearStudentData
} = studentSlice.actions

export default studentSlice.reducer