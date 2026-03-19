import React, { useEffect, useState } from 'react'
import { Container, Table, Badge, Button, Spinner, Form, InputGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaEye, FaPlayCircle, FaCalendar, FaClock } from 'react-icons/fa'
import { formatDate, formatTime } from '../../utils/helpers'
import examService from '../../services/examService'
import toast from 'react-hot-toast'

const StudentExams = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [filteredExams, setFilteredExams] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, upcoming, live, completed

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    filterExams()
  }, [searchTerm, filter, exams])

  const fetchExams = async () => {
    try {
      const response = await examService.getMyExams()
      setExams(response.data)
    } catch (error) {
      toast.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const filterExams = () => {
    let filtered = [...exams]
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(exam => exam.status === filter)
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredExams(filtered)
  }

  const getStatusBadge = (status) => {
    const variants = {
      upcoming: 'warning',
      live: 'success',
      completed: 'secondary'
    }
    return <Badge bg={variants[status]}>{status.toUpperCase()}</Badge>
  }

  const handleViewExam = (exam) => {
    if (exam.status === 'live') {
      navigate(`/student/take-exam/${exam.id}`)
    } else if (exam.status === 'completed') {
      navigate(`/student/results?exam=${exam.id}`)
    }
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading exams...</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Exams</h2>
        <div className="d-flex gap-2">
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={filter === 'live' ? 'success' : 'outline-success'}
            onClick={() => setFilter('live')}
            size="sm"
          >
            Live
          </Button>
          <Button 
            variant={filter === 'upcoming' ? 'warning' : 'outline-warning'}
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === 'completed' ? 'secondary' : 'outline-secondary'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <InputGroup className="mb-4">
        <InputGroup.Text>
          <FaSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Search exams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {/* Exams Table */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No exams found</p>
        </div>
      ) : (
        <Table striped hover responsive className="shadow-sm">
          <thead className="bg-primary text-white">
            <tr>
              <th>Exam Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam.id}>
                <td className="fw-semibold">{exam.name}</td>
                <td>
                  <FaCalendar className="me-2 text-primary" />
                  {formatDate(exam.date)}
                </td>
                <td>
                  <FaClock className="me-2 text-primary" />
                  {formatTime(exam.startTime)}
                </td>
                <td>{exam.duration} mins</td>
                <td>{getStatusBadge(exam.status)}</td>
                <td>
                  {exam.result ? (
                    <span className={exam.result.isPassed ? 'text-success' : 'text-danger'}>
                      {exam.result.percentage}%
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <Button
                    variant={exam.status === 'live' ? 'success' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleViewExam(exam)}
                    disabled={exam.status === 'upcoming'}
                  >
                    {exam.status === 'live' ? (
                      <>
                        <FaPlayCircle className="me-1" />
                        Start
                      </>
                    ) : exam.status === 'completed' ? (
                      <>
                        <FaEye className="me-1" />
                        View
                      </>
                    ) : (
                      'Upcoming'
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  )
}

export default StudentExams