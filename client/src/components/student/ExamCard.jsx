import React from 'react'
import { Card, Button, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaClock, FaCalendar, FaPlayCircle, FaHourglassHalf, FaCheckCircle, FaChartBar } from 'react-icons/fa'
import { formatDate, formatTime } from '../../utils/helpers'

const ExamCard = ({ exam, type }) => {
  const navigate = useNavigate()

  const getStatusBadge = () => {
    const variants = {
      upcoming: 'warning',
      live: 'success',
      completed: 'secondary'
    }
    return <Badge bg={variants[type]}>{type.toUpperCase()}</Badge>
  }

  const getStatusIcon = () => {
    switch(type) {
      case 'live':
        return <FaPlayCircle className="text-success me-2" size={20} />
      case 'upcoming':
        return <FaHourglassHalf className="text-warning me-2" size={20} />
      case 'completed':
        return <FaCheckCircle className="text-secondary me-2" size={20} />
      default:
        return null
    }
  }

  const handleAction = () => {
    if (type === 'live') {
      navigate(`/student/take-exam/${exam.id}`)
    } else if (type === 'completed' && exam.result) {
      navigate(`/student/results?exam=${exam.id}`)
    }
  }

  const getActionButton = () => {
    if (type === 'live') {
      return (
        <Button 
          variant="success" 
          size="sm"
          onClick={handleAction}
          className="w-100"
        >
          <FaPlayCircle className="me-2" />
          Start Exam
        </Button>
      )
    } else if (type === 'upcoming') {
      return (
        <Button variant="warning" size="sm" disabled className="w-100">
          <FaHourglassHalf className="me-2" />
          Not Started
        </Button>
      )
    } else if (type === 'completed') {
      if (exam.result) {
        return (
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={handleAction}
            className="w-100"
          >
            <FaChartBar className="me-2" />
            View Results
          </Button>
        )
      } else {
        return (
          <Button variant="secondary" size="sm" disabled className="w-100">
            <FaHourglassHalf className="me-2" />
            Results Pending
          </Button>
        )
      }
    }
  }

  return (
    <Card className="exam-card h-100 shadow-sm">
      <Card.Header className={`bg-${type} bg-opacity-10 d-flex justify-content-between align-items-center`}>
        <div className="d-flex align-items-center">
          {getStatusIcon()}
          <span className="fw-semibold">{exam.name}</span>
        </div>
        {getStatusBadge()}
      </Card.Header>
      
      <Card.Body>
        <div className="exam-details mb-3">
          <div className="d-flex align-items-center text-muted mb-2">
            <FaCalendar className="me-2" size={14} />
            <small>{formatDate(exam.date)}</small>
          </div>
          <div className="d-flex align-items-center text-muted mb-2">
            <FaClock className="me-2" size={14} />
            <small>{formatTime(exam.startTime)} • {exam.duration} mins</small>
          </div>
        </div>

        {exam.result && (
          <div className="result-preview mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">Your Score:</span>
              <span className={`fw-bold ${exam.result.isPassed ? 'text-success' : 'text-danger'}`}>
                {exam.result.percentage}%
              </span>
            </div>
            <div className="progress mt-2" style={{ height: '5px' }}>
              <div
                className={`progress-bar ${exam.result.isPassed ? 'bg-success' : 'bg-danger'}`}
                style={{ width: `${exam.result.percentage}%` }}
              />
            </div>
          </div>
        )}

        {getActionButton()}
      </Card.Body>

      <style>{`
        .exam-card {
          transition: all 0.3s ease;
          border: none;
          border-radius: 10px;
          overflow: hidden;
        }
        .exam-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .bg-upcoming {
          background-color: rgba(255, 193, 7, 0.1);
        }
        .bg-live {
          background-color: rgba(25, 135, 84, 0.1);
        }
        .bg-completed {
          background-color: rgba(108, 117, 125, 0.1);
        }
      `}</style>
    </Card>
  )
}

export default ExamCard