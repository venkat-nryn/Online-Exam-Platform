import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Button, Alert, Modal, ProgressBar, Badge } from 'react-bootstrap'
import { FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaArrowRight, FaFlag, FaSave } from 'react-icons/fa'
import Timer from './Timer'
import QuestionPalette from './QuestionPalette'
import WarningModal from '../common/WarningModal'
import useExam from '../../hooks/useExam'
import toast from 'react-hot-toast'

const ExamInterface = ({ examId, onComplete }) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle') // idle, saving, saved
  const [networkStatus, setNetworkStatus] = useState('online')
  const previousViolationRef = useRef(0)

  const {
    loading,
    error,
    exam,
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions,
    answers,
    timeRemaining,
    violationCount,
    examStatus,
    getQuestionStatus,
    getProgress,
    handleAnswer,
    handleMarkVisited,
    handleNext,
    handlePrevious,
    handleJumpToQuestion,
    handleSubmitExam,
    saveAllAnswers
  } = useExam(examId)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online')
      toast.success('Connection restored', { icon: '📶' })
      // Retry saving pending answers
      saveAllAnswers()
    }

    const handleOffline = () => {
      setNetworkStatus('offline')
      toast.error('You are offline. Answers will be saved locally.', {
        duration: 0,
        icon: '📡'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [saveAllAnswers])

  // Auto-save
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (examStatus === 'in-progress' && Object.keys(answers).length > 0) {
        setAutoSaveStatus('saving')
        await saveAllAnswers()
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [answers, examStatus, saveAllAnswers])

  const getViolationMessage = () => {
    const remaining = (exam?.settings?.maxViolations || 3) - violationCount - 1
    const baseMessage = 'Anti-cheat violation detected.'

    if (remaining > 0) {
      return `${baseMessage} Warning ${violationCount + 1}/${exam?.settings?.maxViolations}. ${remaining} more violation${remaining > 1 ? 's' : ''} and exam will auto-submit.`
    } else {
      return `${baseMessage} Maximum violations reached! Exam will auto-submit in 45 seconds.`
    }
  }

  useEffect(() => {
    if (violationCount > previousViolationRef.current) {
      setWarningMessage(getViolationMessage())
      setShowWarning(true)
    }
    previousViolationRef.current = violationCount
  }, [violationCount])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Alt + N for next
      if (e.altKey && e.key === 'n') {
        e.preventDefault()
        handleNext()
      }
      // Alt + P for previous
      if (e.altKey && e.key === 'p') {
        e.preventDefault()
        handlePrevious()
      }
      // Alt + S for submit
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        setShowSubmitModal(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleNext, handlePrevious])

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading exam...</span>
        </div>
        <p className="mt-3">Loading exam...</p>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Exam</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    )
  }

  if (!currentQuestion) {
    return (
      <Container className="py-5">
        <Alert variant="warning">No questions found for this exam.</Alert>
      </Container>
    )
  }

  return (
    <>
      <Container fluid className="exam-interface py-3">
        {/* Header */}
        <div className="exam-header bg-white shadow-sm rounded p-3 mb-3">
          <Row className="align-items-center">
            <Col md={4}>
              <h4 className="mb-0">{exam?.examName}</h4>
              <small className="text-muted">
                Question {currentIndex + 1} of {totalQuestions}
              </small>
            </Col>
            
            <Col md={4}>
              <Timer 
                initialSeconds={timeRemaining}
                onTimeUp={() => handleSubmitExam('auto')}
              />
            </Col>
            
            <Col md={4}>
              <div className="d-flex justify-content-end align-items-center gap-3">
                {/* Network Status */}
                <div className={`network-status ${networkStatus}`}>
                  {networkStatus === 'online' ? (
                    <span className="text-success">📶 Online</span>
                  ) : (
                    <span className="text-danger">📡 Offline</span>
                  )}
                </div>

                {/* Auto-save Status */}
                <div className="auto-save-status">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-info">
                      <span className="spinner-border spinner-border-sm me-1" />
                      Saving...
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-success">
                      <FaCheckCircle className="me-1" />
                      Saved
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => setShowSubmitModal(true)}
                >
                  <FaFlag className="me-2" />
                  Submit
                </Button>
              </div>
            </Col>
          </Row>

          {/* Progress Bar */}
          <div className="mt-2">
            <ProgressBar 
              now={getProgress()} 
              label={`${Math.round(getProgress())}%`}
              variant="success"
              style={{ height: '8px' }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Row>
          {/* Question Area */}
          <Col md={8}>
            <div className="question-container bg-white rounded shadow-sm p-4">
              <div className="mb-4">
                <h5 className="mb-3">Question {currentIndex + 1}</h5>
                <p className="lead">{currentQuestion.question}</p>
                <div className="d-flex justify-content-between">
                  <Badge bg="info">Marks: {currentQuestion.marks}</Badge>
                  <Badge 
                    bg={answers[currentQuestion._id || currentQuestion.id] ? 'success' : 'warning'}
                  >
                    {answers[currentQuestion._id || currentQuestion.id] ? 'Answered' : 'Not Answered'}
                  </Badge>
                </div>
              </div>

              <div className="options-container">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div
                    key={option}
                    className={`option-item p-3 mb-3 rounded border ${
                      answers[currentQuestion._id || currentQuestion.id] === option 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-light border-secondary'
                    }`}
                    onClick={() => handleAnswer(currentQuestion._id || currentQuestion.id, option)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <div className={`option-letter me-3 fw-bold ${
                        answers[currentQuestion._id || currentQuestion.id] === option ? 'text-white' : 'text-primary'
                      }`}>
                        {option}.
                      </div>
                      <div className="flex-grow-1">
                        {currentQuestion.options[option]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-secondary"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <FaArrowLeft className="me-2" />
                  Previous (Alt+P)
                </Button>
                
                {currentIndex === totalQuestions - 1 ? (
                  <Button
                    variant="success"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Exam (Alt+S)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                  >
                    Next (Alt+N)
                    <FaArrowRight className="ms-2" />
                  </Button>
                )}
              </div>
            </div>
          </Col>

          {/* Question Palette */}
          <Col md={4}>
            <QuestionPalette
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              visitedQuestions={{}}
              onJumpToQuestion={handleJumpToQuestion}
            />

            {/* Instructions Card */}
            <div className="bg-white rounded shadow-sm p-3 mt-3">
              <h6>Instructions:</h6>
              <ul className="small text-muted mb-0">
                <li>Do not switch tabs or windows</li>
                <li>Stay in full screen mode</li>
                <li>Answers are auto-saved every 30 seconds</li>
                <li>Use Alt+N for next, Alt+P for previous</li>
                <li>Click on question numbers to jump</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Submit Confirmation Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Submit Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to submit your exam?</p>
          
          <div className="bg-light p-3 rounded mb-3">
            <div className="d-flex justify-content-between mb-2">
              <span>Total Questions:</span>
              <strong>{totalQuestions}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Answered:</span>
              <strong className="text-success">
                {Object.keys(answers).length}
              </strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Remaining:</span>
              <strong className="text-warning">
                {totalQuestions - Object.keys(answers).length}
              </strong>
            </div>
          </div>

          {Object.keys(answers).length < totalQuestions && (
            <Alert variant="warning">
              <FaExclamationTriangle className="me-2" />
              You have {totalQuestions - Object.keys(answers).length} unanswered questions.
            </Alert>
          )}

          <p className="text-muted small mb-0">
            Once submitted, you cannot change your answers.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              setShowSubmitModal(false)
              handleSubmitExam()
            }}
          >
            Submit Exam
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Warning Modal */}
      <WarningModal
        show={showWarning}
        onClose={() => setShowWarning(false)}
        message={warningMessage}
        type={violationCount >= (exam?.settings?.maxViolations || 3) - 1 ? 'danger' : 'warning'}
      />

      <style>{`
        .exam-interface {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .option-item {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .option-item:hover:not(.bg-primary) {
          background-color: #e9ecef !important;
          transform: translateX(5px);
        }
        
        .option-letter {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: rgba(0,0,0,0.05);
        }
        
        .bg-primary .option-letter {
          background-color: rgba(255,255,255,0.2);
        }
        
        .network-status {
          font-size: 0.875rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .network-status.online {
          background-color: rgba(25, 135, 84, 0.1);
        }
        
        .network-status.offline {
          background-color: rgba(220, 53, 69, 0.1);
        }
        
        .auto-save-status {
          font-size: 0.875rem;
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </>
  )
}

export default ExamInterface