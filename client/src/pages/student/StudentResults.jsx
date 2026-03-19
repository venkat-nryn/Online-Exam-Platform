import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaDownload, FaChartBar, FaCheckCircle, FaTimesCircle, FaArrowLeft } from 'react-icons/fa'
import { formatDate } from '../../utils/helpers'
import resultService from '../../services/resultService'
import toast from 'react-hot-toast'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const StudentResults = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const studentId = user?._id || user?.id
  const queryParams = new URLSearchParams(location.search)
  const examId = queryParams.get('exam')
  
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    if (examId) {
      fetchSingleResult()
    } else {
      fetchAllResults()
    }
  }, [examId, studentId])

  const fetchAllResults = async () => {
    if (!studentId) {
      setLoading(false)
      toast.error('Student session not found. Please login again.')
      return
    }
    try {
      const response = await resultService.getStudentResults(studentId)
      setResults(response.data.results)
      setAnalytics(response.data.statistics)
    } catch (error) {
      toast.error('Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleResult = async () => {
    if (!studentId) {
      setLoading(false)
      toast.error('Student session not found. Please login again.')
      return
    }
    try {
      const response = await resultService.getStudentExamResult(studentId, examId)
      setSelectedResult(response.data)
    } catch (error) {
      toast.error('Failed to fetch result details')
    } finally {
      setLoading(false)
    }
  }

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

  const pieChartData = {
    labels: ['Correct', 'Incorrect', 'Unanswered'],
    datasets: [{
      data: [
        selectedResult?.answers?.filter(a => a.isCorrect).length || 0,
        selectedResult?.answers?.filter(a => !a.isCorrect && a.answer).length || 0,
        selectedResult?.answers?.filter(a => !a.answer).length || 0
      ],
      backgroundColor: ['#198754', '#dc3545', '#ffc107'],
      borderWidth: 0
    }]
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading results...</p>
      </Container>
    )
  }

  // Single Result View
  if (selectedResult) {
    const { result, answers } = selectedResult
    const correctAnswers = answers?.filter(a => a.isCorrect).length || 0
    const incorrectAnswers = answers?.filter(a => !a.isCorrect && a.answer).length || 0
    const unanswered = answers?.filter(a => !a.answer).length || 0

    return (
      <Container fluid className="py-4">
        <Button 
          variant="link" 
          className="mb-3 p-0"
          onClick={() => navigate('/student/results')}
        >
          <FaArrowLeft className="me-2" />
          Back to All Results
        </Button>

        <Row>
          <Col md={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">{result.exam.examName} - Result</h4>
              </Card.Header>
              <Card.Body>
                <Row className="mb-4">
                  <Col md={6}>
                    <h5>Exam Details</h5>
                    <p><strong>Date:</strong> {formatDate(result.exam.date)}</p>
                    <p><strong>Total Marks:</strong> {result.totalMarks}</p>
                    <p><strong>Pass Mark:</strong> {result.exam.passMark}</p>
                  </Col>
                  <Col md={6}>
                    <h5>Your Score</h5>
                    <div className={`display-4 fw-bold text-${getGradeColor(result.percentage)}`}>
                      {result.percentage}%
                    </div>
                    <p className="mb-0">
                      <strong>Marks:</strong> {result.obtainedMarks}/{result.totalMarks}
                    </p>
                    <p>
                      <strong>Grade:</strong>{' '}
                      <Badge bg={getGradeColor(result.percentage)}>
                        {getGrade(result.percentage)}
                      </Badge>
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      {result.isPassed ? (
                        <Badge bg="success">PASSED</Badge>
                      ) : (
                        <Badge bg="danger">FAILED</Badge>
                      )}
                    </p>
                  </Col>
                </Row>

                <h5 className="mb-3">Question-wise Analysis</h5>
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Your Answer</th>
                      <th>Correct Answer</th>
                      <th>Status</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answers?.map((ans, index) => (
                      <tr key={ans.questionId._id}>
                        <td>{index + 1}</td>
                        <td>{ans.questionId.question.substring(0, 50)}...</td>
                        <td>
                          {ans.answer ? (
                            <span className={`badge bg-${ans.isCorrect ? 'success' : 'danger'}`}>
                              {ans.answer}
                            </span>
                          ) : (
                            <span className="badge bg-warning">Not Answered</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {ans.questionId.correctAnswer}
                          </span>
                        </td>
                        <td>
                          {ans.isCorrect ? (
                            <FaCheckCircle className="text-success" size={20} />
                          ) : ans.answer ? (
                            <FaTimesCircle className="text-danger" size={20} />
                          ) : (
                            <span className="text-warning">-</span>
                          )}
                        </td>
                        <td>
                          {ans.isCorrect ? ans.questionId.marks : 0} / {ans.questionId.marks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Performance Summary</h5>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '200px' }}>
                  <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                </div>
                
                <hr />
                
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Correct Answers:</span>
                    <strong className="text-success">{correctAnswers}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Incorrect Answers:</span>
                    <strong className="text-danger">{incorrectAnswers}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Unanswered:</span>
                    <strong className="text-warning">{unanswered}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Accuracy:</span>
                    <strong>
                      {((correctAnswers / (correctAnswers + incorrectAnswers)) * 100 || 0).toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <hr />

                <Button 
                  variant="outline-primary" 
                  className="w-100"
                  onClick={() => window.print()}
                >
                  <FaDownload className="me-2" />
                  Download Result
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // All Results View
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">My Results</h2>

      {/* Statistics Cards */}
      {analytics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-0 bg-primary text-white">
              <Card.Body>
                <h6>Total Exams</h6>
                <h3>{analytics.totalExams}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0 bg-success text-white">
              <Card.Body>
                <h6>Passed</h6>
                <h3>{analytics.passed}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0 bg-danger text-white">
              <Card.Body>
                <h6>Failed</h6>
                <h3>{analytics.failed}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0 bg-info text-white">
              <Card.Body>
                <h6>Average</h6>
                <h3>{analytics.averagePercentage.toFixed(1)}%</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Results Table */}
      {results.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <p className="text-muted mb-3">No results available yet.</p>
            <Button variant="primary" onClick={() => navigate('/student/exams')}>
              View Available Exams
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Date</th>
                  <th>Total Marks</th>
                  <th>Obtained</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id}>
                    <td className="fw-semibold">{result.exam.examName}</td>
                    <td>{formatDate(result.exam.date)}</td>
                    <td>{result.totalMarks}</td>
                    <td>{result.obtainedMarks}</td>
                    <td>
                      <span className={`badge bg-${getGradeColor(result.percentage)}`}>
                        {result.percentage.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <Badge bg={getGradeColor(result.percentage)}>
                        {getGrade(result.percentage)}
                      </Badge>
                    </td>
                    <td>
                      {result.isPassed ? (
                        <Badge bg="success">PASS</Badge>
                      ) : (
                        <Badge bg="danger">FAIL</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/student/results?exam=${result.exam._id}`)}
                      >
                        <FaChartBar className="me-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default StudentResults