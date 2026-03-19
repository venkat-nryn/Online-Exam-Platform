import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaClock, FaCalendar, FaCheckCircle, FaPlayCircle, FaHourglassHalf } from 'react-icons/fa'
import { formatDate, formatTime } from '../../utils/helpers'
import examService from '../../services/examService'
import toast from 'react-hot-toast'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState({
    upcoming: [],
    live: [],
    completed: []
  })
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0
  })

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const response = await examService.getMyExams()
      const allExams = response.data
      
      // Categorize exams
      const categorized = {
        upcoming: [],
        live: [],
        completed: []
      }
      
      allExams.forEach(exam => {
        if (exam.status === 'upcoming') {
          categorized.upcoming.push(exam)
        } else if (exam.status === 'live') {
          categorized.live.push(exam)
        } else {
          categorized.completed.push(exam)
        }
      })
      
      setExams(categorized)
      
      // Calculate stats
      const completed = categorized.completed.length
      const scoredCompleted = categorized.completed.filter(exam => exam.result)
      const avgScore = scoredCompleted.reduce((acc, exam) => 
        acc + (exam.result?.percentage || 0), 0) / (scoredCompleted.length || 1)
      
      setStats({
        totalExams: allExams.length,
        completedExams: completed,
        averageScore: avgScore.toFixed(2)
      })
    } catch (error) {
      toast.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      upcoming: 'warning',
      live: 'success',
      completed: 'secondary'
    }
    return <Badge bg={variants[status]}>{status.toUpperCase()}</Badge>
  }

  const renderExamCard = (exam, type) => (
    <Card key={exam.id} className="mb-3 shadow-sm hover-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="mb-0">{exam.name}</h5>
          {getStatusBadge(type)}
        </div>
        
        <div className="text-muted small mb-3">
          <div><FaCalendar className="me-2" />{formatDate(exam.date)}</div>
          <div><FaClock className="me-2" />{formatTime(exam.startTime)} • {exam.duration} mins</div>
        </div>
        
        {type === 'live' && (
          <Button 
            variant="success" 
            size="sm"
            onClick={() => navigate(`/student/take-exam/${exam.id}`)}
            className="w-100"
          >
            <FaPlayCircle className="me-2" />
            Start Exam
          </Button>
        )}
        
        {type === 'upcoming' && (
          <Button variant="warning" size="sm" disabled className="w-100">
            <FaHourglassHalf className="me-2" />
            Not Started
          </Button>
        )}
        
        {type === 'completed' && exam.result && (
          <div>
            <div className="d-flex justify-content-between mb-2">
              <span>Score:</span>
              <strong className={exam.result.isPassed ? 'text-success' : 'text-danger'}>
                {exam.result.obtainedMarks}/{exam.totalMarks} ({exam.result.percentage}%)
              </strong>
            </div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => navigate(`/student/results?exam=${exam.id}`)}
              className="w-100"
            >
              <FaCheckCircle className="me-2" />
              View Results
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  )

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Student Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-primary text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaCalendar size={40} />
              </div>
              <div>
                <h3 className="mb-0">{stats.totalExams}</h3>
                <small>Total Exams</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-success text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaCheckCircle size={40} />
              </div>
              <div>
                <h3 className="mb-0">{stats.completedExams}</h3>
                <small>Completed Exams</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-info text-white">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaHourglassHalf size={40} />
              </div>
              <div>
                <h3 className="mb-0">{stats.averageScore}%</h3>
                <small>Average Score</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Live Exams Section */}
      {exams.live.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-3 text-success">Live Exams</h4>
          <Row>
            {exams.live.map(exam => (
              <Col md={4} key={exam.id}>
                {renderExamCard(exam, 'live')}
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Upcoming Exams Section */}
      {exams.upcoming.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-3 text-warning">Upcoming Exams</h4>
          <Row>
            {exams.upcoming.map(exam => (
              <Col md={4} key={exam.id}>
                {renderExamCard(exam, 'upcoming')}
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Completed Exams Section */}
      {exams.completed.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-3 text-secondary">Completed Exams</h4>
          <Row>
            {exams.completed.map(exam => (
              <Col md={4} key={exam.id}>
                {renderExamCard(exam, 'completed')}
              </Col>
            ))}
          </Row>
        </div>
      )}

      <style>{`
        .hover-card {
          transition: all 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </Container>
  )
}

export default StudentDashboard