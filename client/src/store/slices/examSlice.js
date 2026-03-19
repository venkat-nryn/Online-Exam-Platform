import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentExam: null,
  questions: [],
  answers: {},
  visitedQuestions: [],
  timeRemaining: 0,
  examStatus: 'pending', // pending, started, completed
  violationCount: 0,
  autoSaveEnabled: true,
  currentQuestionIndex: 0,
  examResult: null
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setCurrentExam: (state, action) => {
      state.currentExam = action.payload
    },
    setQuestions: (state, action) => {
      state.questions = action.payload
      // Initialize answers
      action.payload.forEach(q => {
        state.answers[q._id] = null
      })
    },
    saveAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.answers[questionId] = answer
      
      // Mark as answered and visited
      if (!state.visitedQuestions.includes(questionId)) {
        state.visitedQuestions.push(questionId)
      }
    },
    markVisited: (state, action) => {
      const questionId = action.payload
      if (!state.visitedQuestions.includes(questionId)) {
        state.visitedQuestions.push(questionId)
      }
    },
    setTimeRemaining: (state, action) => {
      state.timeRemaining = action.payload
    },
    decrementTime: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    setExamStatus: (state, action) => {
      state.examStatus = action.payload
    },
    incrementViolation: (state) => {
      state.violationCount += 1
    },
    resetViolations: (state) => {
      state.violationCount = 0
    },
    setAutoSave: (state, action) => {
      state.autoSaveEnabled = action.payload
    },
    setCurrentQuestionIndex: (state, action) => {
      state.currentQuestionIndex = action.payload
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1
      }
    },
    setExamResult: (state, action) => {
      state.examResult = action.payload
    },
    clearExam: (state) => {
      state.currentExam = null
      state.questions = []
      state.answers = {}
      state.visitedQuestions = []
      state.timeRemaining = 0
      state.examStatus = 'pending'
      state.violationCount = 0
      state.currentQuestionIndex = 0
      state.examResult = null
    }
  }
})

export const {
  setCurrentExam,
  setQuestions,
  saveAnswer,
  markVisited,
  setTimeRemaining,
  decrementTime,
  setExamStatus,
  incrementViolation,
  resetViolations,
  setAutoSave,
  setCurrentQuestionIndex,
  nextQuestion,
  previousQuestion,
  setExamResult,
  clearExam
} = examSlice.actions

export default examSlice.reducer
