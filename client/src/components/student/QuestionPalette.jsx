import React from 'react'
import { Card, Row, Col } from 'react-bootstrap'
import { FaCheckCircle, FaCircle, FaEye } from 'react-icons/fa'

const QuestionPalette = ({ questions, currentIndex, answers, onJumpToQuestion }) => {
  const getQuestionStatus = (questionId, index) => {
    if (answers[questionId]) {
      return 'answered'
    }
    if (index === currentIndex) {
      return 'current'
    }
    return 'not-visited'
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'answered':
        return <FaCheckCircle className="text-success" />
      case 'current':
        return <FaEye className="text-primary" />
      default:
        return <FaCircle className="text-secondary" />
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'answered':
        return 'bg-success text-white'
      case 'current':
        return 'bg-primary text-white'
      default:
        return 'bg-secondary text-white'
    }
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length
  const remainingCount = totalQuestions - answeredCount

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Question Palette</h5>
      </Card.Header>
      
      <Card.Body>
        {/* Legend */}
        <div className="d-flex justify-content-between mb-3 small">
          <div className="d-flex align-items-center">
            <FaCheckCircle className="text-success me-1" />
            <span>Answered ({answeredCount})</span>
          </div>
          <div className="d-flex align-items-center">
            <FaEye className="text-primary me-1" />
            <span>Current</span>
          </div>
          <div className="d-flex align-items-center">
            <FaCircle className="text-secondary me-1" />
            <span>Not Visited ({remainingCount})</span>
          </div>
        </div>

        {/* Question Grid */}
        <Row className="g-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question._id, index)
            return (
              <Col xs={3} key={question._id}>
                <div
                  className={`question-number p-2 text-center rounded cursor-pointer ${getStatusColor(status)}`}
                  onClick={() => onJumpToQuestion(index)}
                  style={{ cursor: 'pointer' }}
                >
                  {index + 1}
                </div>
              </Col>
            )
          })}
        </Row>

        {/* Summary */}
        <hr />
        <div className="text-center small">
          <div className="d-flex justify-content-between mb-1">
            <span>Total Questions:</span>
            <strong>{totalQuestions}</strong>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span>Answered:</span>
            <strong className="text-success">{answeredCount}</strong>
          </div>
          <div className="d-flex justify-content-between">
            <span>Remaining:</span>
            <strong className="text-warning">{remainingCount}</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default QuestionPalette