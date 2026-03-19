import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  setCurrentExam,
  setQuestions,
  saveAnswer,
  markVisited,
  setTimeRemaining,
  setExamStatus,
  incrementViolation,
  nextQuestion,
  previousQuestion,
  setCurrentQuestionIndex,
  clearExam
} from '../store/slices/examSlice'
import examService from '../services/examService'
import AntiCheatSystem from '../utils/antiCheat'
import toast from 'react-hot-toast'

const useExam = (examId) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const antiCheatRef = useRef(null)
  const autoSubmitTimeoutRef = useRef(null)
  const isSubmittingRef = useRef(false)
  const hasSubmittedRef = useRef(false)
  
  const {
    currentExam,
    questions,
    answers,
    visitedQuestions,
    timeRemaining,
    examStatus,
    violationCount,
    currentQuestionIndex
  } = useSelector((state) => state.exam)

  // Load exam data
  useEffect(() => {
    loadExam()
  }, [examId])

  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current)
      }
      if (antiCheatRef.current) {
        antiCheatRef.current.cleanup()
      }
    }
  }, [])

  const loadExam = async () => {
    setLoading(true)
    try {
      const response = await examService.startExam(examId)
      dispatch(setCurrentExam(response.data.exam))
      dispatch(setQuestions(response.data.questions))
      dispatch(setExamStatus('in-progress'))
      
      // Calculate initial time remaining
      const endTime = new Date(response.data.endTime)
      const now = new Date()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      dispatch(setTimeRemaining(remaining))
      
      // Initialize anti-cheat
      const ac = new AntiCheatSystem(
        examId,
        handleViolation,
        response.data.exam.settings.maxViolations
      )
      if (antiCheatRef.current) {
        antiCheatRef.current.cleanup()
      }
      ac.init()
      antiCheatRef.current = ac
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load exam')
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save answers
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (examStatus === 'in-progress' && Object.keys(answers).length > 0) {
        saveAllAnswers()
      }
    }, 10000) // Auto-save every 10 seconds

    return () => clearInterval(autoSaveInterval)
  }, [answers, examStatus])

  const saveAllAnswers = useCallback(async () => {
    try {
      const answerPromises = Object.entries(answers).map(([questionId, answer]) =>
        examService.saveAnswer(examId, questionId, answer)
      )
      await Promise.all(answerPromises)
      console.log('Auto-save completed')
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [examId, answers])

  const handleAnswer = useCallback(async (questionId, answer) => {
    dispatch(saveAnswer({ questionId, answer }))
    
    // Save to server
    try {
      await examService.saveAnswer(examId, questionId, answer)
    } catch (error) {
      toast.error('Failed to save answer')
    }
  }, [examId, dispatch])

  const handleMarkVisited = useCallback(async (questionId) => {
    dispatch(markVisited(questionId))
    
    try {
      await examService.markVisited(examId, questionId)
    } catch (error) {
      console.error('Failed to mark visited:', error)
    }
  }, [examId, dispatch])

  const handleViolation = useCallback(async (type, details) => {
    if (examStatus !== 'in-progress' || hasSubmittedRef.current) {
      return
    }

    dispatch(incrementViolation())
    
    try {
      const response = await examService.reportViolation(examId, type, details)
      
      // Check if exam should auto-submit
      if (response.data.shouldAutoSubmit) {
        toast.error('Exam will auto-submit in 45 seconds due to multiple violations')
        if (autoSubmitTimeoutRef.current) {
          clearTimeout(autoSubmitTimeoutRef.current)
        }
        autoSubmitTimeoutRef.current = setTimeout(() => {
          handleSubmitExam('auto')
        }, 45000)
      }
    } catch (error) {
      console.error('Failed to report violation:', error)
    }
  }, [examId, dispatch, examStatus])

  const handleSubmitExam = useCallback(async (submitType = 'manual') => {
    if (isSubmittingRef.current || hasSubmittedRef.current) {
      return
    }

    isSubmittingRef.current = true
    try {
      // Save all pending answers
      await saveAllAnswers()
      
      // Submit exam
      const response = await examService.submitExam(examId)

      hasSubmittedRef.current = true

      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current)
      }
      
      // Clean up anti-cheat
      if (antiCheatRef.current) {
        antiCheatRef.current.cleanup()
        antiCheatRef.current = null
      }
      
      toast.success('Exam submitted successfully!')
      dispatch(setExamStatus('completed'))
      dispatch(clearExam())
      
      // Navigate to result page
      navigate(`/student/results?exam=${examId}`)
      
    } catch (error) {
      toast.error('Failed to submit exam')
      isSubmittingRef.current = false
    }
  }, [examId, saveAllAnswers, dispatch, navigate])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion())
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      dispatch(previousQuestion())
    }
  }, [currentQuestionIndex, dispatch])

  const handleJumpToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      dispatch(setCurrentQuestionIndex(index))
      
      // Mark as visited
      const questionId = questions[index]._id || questions[index].id
      if (!visitedQuestions.includes(questionId)) {
        handleMarkVisited(questionId)
      }
    }
  }, [questions, visitedQuestions, dispatch, handleMarkVisited])

  const getQuestionStatus = useCallback((questionId) => {
    if (answers[questionId]) return 'answered'
    if (visitedQuestions.includes(questionId)) return 'visited'
    return 'not-visited'
  }, [answers, visitedQuestions])

  const getProgress = useCallback(() => {
    const answered = Object.keys(answers).length
    const total = questions.length
    return total > 0 ? (answered / total) * 100 : 0
  }, [answers, questions])

  return {
    loading,
    error,
    exam: currentExam,
    questions,
    currentQuestion: questions[currentQuestionIndex],
    currentIndex: currentQuestionIndex,
    totalQuestions: questions.length,
    answers,
    visitedQuestions,
    timeRemaining,
    examStatus,
    violationCount,
    getQuestionStatus,
    getProgress,
    handleAnswer,
    handleMarkVisited,
    handleNext,
    handlePrevious,
    handleJumpToQuestion,
    handleSubmitExam,
    saveAllAnswers
  }
}

export default useExam