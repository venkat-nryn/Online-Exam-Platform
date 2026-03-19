import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup } from 'react-bootstrap'
import { FaEye, FaCheck, FaTimes, FaDownload, FaSearch, FaToggleOn, FaToggleOff, FaCalendar } from 'react-icons/fa'
import resultService from '../../services/resultService'
import examService from '../../services/examService'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { saveAs } from 'file-saver'

const AdminResults = () => {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [results, setResults] = useState([])
  const [showResultModal, setShowResultModal] = useState(false)
  const [showMarksModal, setShowMarksModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [marksForm, setMarksForm] = useState({
    obtainedMarks: 0,
    remarks: ''
  })

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const response = await examService.getAllExams()
      setExams(response.data)
    } catch (error) {
      toast.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async (examId) => {
    setLoading(true)
    try {
      const response = await resultService.getResultsByExam(examId)
      setResults(response.data.results)
      setSelectedExam(exams.find(e => e._id === examId))
    } catch (error) {
      toast.error('Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const handlePublishResults = async (examId) => {
    try {
      await resultService.publishResults(examId)
      toast.success('Results published successfully')
      fetchResults(examId)
    } catch (error) {
      toast.error('Failed to publish results')
    }
  }

  const handleUnpublishResults = async (examId) => {
    try {
      await resultService.unpublishResults(examId)
      toast.success('Results unpublished successfully')
      fetchResults(examId)
    } catch (error) {
      toast.error('Failed to unpublish results')
    }
  }

  const handleViewResult = async (result) => {
    const studentId = result?.student?._id || result?.student
    const examId = result?.exam?._id || result?.exam || selectedExam?._id

    if (!studentId || !examId) {
      toast.error('Missing student or exam information for this result')
      return
    }

    try {
      const response = await resultService.getStudentExamResult(studentId, examId)
      setSelectedResult(response.data)
      setShowResultModal(true)
    } catch (error) {
      toast.error('Failed to fetch result details')
    }
  }

  const handleUpdateMarks = async () => {
    try {
      await resultService.updateResultMarks(selectedResult.result._id, marksForm)
      toast.success('Marks updated successfully')
      setShowMarksModal(false)
      fetchResults(selectedExam._id)
    } catch (error) {
      toast.error('Failed to update marks')
    }
  }

  const handleDownloadReport = async (examId) => {
    try {
      const data = await resultService.downloadResultReport(examId)
      const blob = new Blob([data], { type: 'text/csv' })
      saveAs(blob, `results_${examId}_${Date.now()}.csv`)
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const filteredResults = results.filter(result =>
    result.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !selectedExam) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading results...</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Result Management</h2>

      {/* Exam Selection */}
      {!selectedExam ? (
        <Row>
          {exams.map(exam => (
            <Col md={4} key={exam._id}>
              <Card className="shadow-sm mb-3 hover-card" onClick={() => fetchResults(exam._id)}>
                <Card.Body>
                  <h5>{exam.examName}</h5>
                  <p className="text-muted mb-2">
                    <FaCalendar className="me-2" />
                    {formatDate(exam.date)}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg={exam.isResultPublished ? 'success' : 'warning'}>
                      {exam.isResultPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Button variant="primary" size="sm">
                      View Results
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <>
          {/* Exam Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button 
                variant="link" 
                className="p-0 me-3"
                onClick={() => setSelectedExam(null)}
              >
                ← Back to Exams
              </Button>
              <h4 className="d-inline">{selectedExam.examName}</h4>
              <Badge bg={selectedExam.isResultPublished ? 'success' : 'warning'} className="ms-2">
                {selectedExam.isResultPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                onClick={() => handleDownloadReport(selectedExam._id)}
              >
                <FaDownload className="me-2" />
                Download Report
              </Button>
              {selectedExam.isResultPublished ? (
                <Button 
                  variant="warning" 
                  onClick={() => handleUnpublishResults(selectedExam._id)}
                >
                  <FaToggleOff className="me-2" />
                  Unpublish Results
                </Button>
              ) : (
                <Button 
                  variant="success" 
                  onClick={() => handlePublishResults(selectedExam._id)}
                >
                  <FaToggleOn className="me-2" />
                  Publish Results
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <InputGroup className="mb-4">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by student name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {/* Results Table */}
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped hover responsive>
                <thead className="bg-primary text-white">
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Group</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result._id}>
                      <td className="fw-semibold">{result.student?.name}</td>
                      <td>{result.student?.rollNumber}</td>
                      <td>{result.student?.group?.groupName || 'N/A'}</td>
                      <td>{result.obtainedMarks}/{result.totalMarks}</td>
                      <td>
                        <span className={`badge bg-${result.percentage >= 40 ? 'success' : 'danger'}`}>
                          {result.percentage.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        {result.isPassed ? (
                          <Badge bg="success">PASS</Badge>
                        ) : (
                          <Badge bg="danger">FAIL</Badge>
                        )}
                      </td>
                      <td>
                        {result.isPublished ? (
                          <Badge bg="success">Published</Badge>
                        ) : (
                          <Badge bg="warning">Draft</Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewResult(result)}
                        >
                          <FaEye />
                        </Button>
                        {!selectedExam.isResultPublished && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => {
                              setSelectedResult({ result })
                              setMarksForm({
                                obtainedMarks: result.obtainedMarks,
                                remarks: ''
                              })
                              setShowMarksModal(true)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Result Details Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Result Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Student Information</h6>
                  <p><strong>Name:</strong> {selectedResult.result.student?.name}</p>
                  <p><strong>Roll Number:</strong> {selectedResult.result.student?.rollNumber}</p>
                  <p><strong>Email:</strong> {selectedResult.result.student?.email}</p>
                </Col>
                <Col md={6}>
                  <h6>Exam Information</h6>
                  <p><strong>Exam:</strong> {selectedResult.result.exam?.examName}</p>
                  <p><strong>Date:</strong> {formatDate(selectedResult.result.exam?.date)}</p>
                  <p><strong>Total Marks:</strong> {selectedResult.result.totalMarks}</p>
                </Col>
              </Row>

              <h6 className="mb-3">Question-wise Analysis</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Student Answer</th>
                    <th>Correct Answer</th>
                    <th>Marks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedResult.answers?.map((ans, index) => (
                    <tr key={ans.questionId?._id}>
                      <td>{index + 1}</td>
                      <td>{ans.questionId?.question?.substring(0, 50)}...</td>
                      <td>
                        {ans.answer ? (
                          <Badge bg="info">{ans.answer}</Badge>
                        ) : (
                          <Badge bg="secondary">Not Answered</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="success">{ans.questionId?.correctAnswer}</Badge>
                      </td>
                      <td>{ans.marksObtained}/{ans.questionId?.marks}</td>
                      <td>
                        {ans.isCorrect ? (
                          <FaCheck className="text-success" />
                        ) : ans.answer ? (
                          <FaTimes className="text-danger" />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Marks Modal */}
      <Modal show={showMarksModal} onHide={() => setShowMarksModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Obtained Marks</Form.Label>
              <Form.Control
                type="number"
                value={marksForm.obtainedMarks}
                onChange={(e) => setMarksForm({ ...marksForm, obtainedMarks: parseFloat(e.target.value) })}
                min="0"
                max={selectedResult?.result?.totalMarks}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={marksForm.remarks}
                onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
                placeholder="Add remarks (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMarksModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateMarks}>
            Update Marks
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .hover-card {
          cursor: pointer;
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

export default AdminResults