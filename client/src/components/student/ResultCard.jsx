import React from 'react'
import { Card, Badge, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaChartBar, FaDownload } from 'react-icons/fa'
import { formatDate } from '../../utils/helpers'

const ResultCard = ({ result }) => {
  const navigate = useNavigate()

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 60) return 'primary'
    if (percentage >= 40) return 'warning'
    return 'danger'
  }

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B'
    if (percentage >= 60) return 'C'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  return (
    <Card className="shadow-sm h-100 hover-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="mb-0">{result.exam.examName}</h5>
          <Badge bg={result.isPassed ? 'success' : 'danger'}>
            {result.isPassed ? 'PASS' : 'FAIL'}
          </Badge>
        </div>

        <div className="text-center mb-3">
          <div className={`display-4 fw-bold text-${getGradeColor(result.percentage)}`}>
            {result.percentage}%
          </div>
          <Badge bg={getGradeColor(result.percentage)}>
            Grade: {getGrade(result.percentage)}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Date:</span>
            <strong>{formatDate(result.exam.date)}</strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Marks:</span>
            <strong>{result.obtainedMarks}/{result.totalMarks}</strong>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar bg-${getGradeColor(result.percentage)}`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            className="flex-grow-1"
            onClick={() => navigate(`/student/results?exam=${result.exam._id}`)}
          >
            <FaChartBar className="me-1" />
            Details
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => window.print()}
          >
            <FaDownload />
          </Button>
        </div>
      </Card.Body>

      <style>{`
        .hover-card {
          transition: all 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </Card>
  )
}

export default ResultCard