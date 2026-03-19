import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Button, Alert, Modal } from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import useExam from '../../hooks/useExam'
import Timer from '../../components/student/Timer'
import QuestionPalette from '../../components/student/QuestionPalette'
import WarningModal from '../../components/common/WarningModal'
import toast from 'react-hot-toast'

const TakeExam = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  
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
    handleAnswer,
    handleNext,
    handlePrevious,
    handleJumpToQuestion,
    handleSubmitExam,
    getProgress
  } = useExam(examId)

  useEffect(() => {
    // Show warning when violations reach certain thresholds
    if (violationCount === 1) {
      setWarningMessage('Warning: You are leaving the exam screen. 2 more warnings and exam will auto-submit.')
      setShowWarning(true)
    } else if (violationCount === 2) {
      setWarningMessage('Final Warning: One more violation and exam will auto-submit in 45 seconds!')
      setShowWarning(true)
    } else if (violationCount >= 3) {
      setWarningMessage('Maximum violations reached! Exam will auto-submit in 45 seconds.')
      setShowWarning(true)
    }
  }, [violationCount])

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
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
          <Button variant="danger" onClick={() => navigate('/student/exams')}>
            Go Back
          </Button>
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
      <Container fluid className="exam-container py-3">
        {/* Header with Timer */}
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
              <div>
                <h4 className="mb-0">{exam?.examName}</h4>
                <small className="text-muted">
                  Question {currentIndex + 1} of {totalQuestions}
                </small>
              </div>
              <Timer 
                initialSeconds={timeRemaining}
                onTimeUp={() => handleSubmitExam('auto')}
              />
            </div>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          {/* Question Area */}
          <Col md={8}>
            <div className="question-container bg-white p-4 rounded shadow-sm">
              <div className="mb-4">
                <h5 className="mb-3">Question {currentIndex + 1}</h5>
                <p className="lead">{currentQuestion.question}</p>
                <small className="text-muted">Marks: {currentQuestion.marks}</small>
              </div>

              <div className="options-container">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div
                    key={option}
                    className={`option-item p-3 mb-2 rounded border ${
                      answers[currentQuestion._id] === option 
                        ? 'bg-primary text-white' 
                        : 'bg-light'
                    }`}
                    onClick={() => handleAnswer(currentQuestion._id, option)}
                    style={{ cursor: 'pointer' }}
                  >
                    <strong>{option}.</strong> {currentQuestion.options[option]}
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between mt-4">
                <Button
                  variant="outline-primary"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <FaArrowLeft className="me-2" />
                  Previous
                </Button>
                
                {currentIndex === totalQuestions - 1 ? (
                  <Button
                    variant="success"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                  >
                    Next
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
              onJumpToQuestion={handleJumpToQuestion}
            />
            
            {/* Progress Bar */}
            <div className="bg-white p-3 rounded shadow-sm mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Progress</span>
                <span>{Math.round(getProgress())}%</span>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${getProgress()}%` }}
                  aria-valuenow={getProgress()}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
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
          <p className="mb-0">
            <strong>Questions answered:</strong> {Object.keys(answers).length}/{totalQuestions}
          </p>
          {Object.keys(answers).length < totalQuestions && (
            <Alert variant="warning" className="mt-3">
              <FaExclamationTriangle className="me-2" />
              You have {totalQuestions - Object.keys(answers).length} unanswered questions.
            </Alert>
          )}
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
        type={violationCount >= 3 ? 'danger' : 'warning'}
      />
    </>
  )
}

export default TakeExam