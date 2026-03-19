import React, { useState } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap'
import { FaEye, FaCheck, FaTimes, FaDownload, FaSearch, FaToggleOn, FaToggleOff, FaEdit } from 'react-icons/fa'
import { formatDate } from '../../utils/helpers'
import { saveAs } from 'file-saver'

const ResultManagement = ({ 
  results, 
  selectedExam,
  onViewDetails, 
  onUpdateMarks, 
  onPublish, 
  onUnpublish,
  onDownload 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [showMarksModal, setShowMarksModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [marksForm, setMarksForm] = useState({
    obtainedMarks: 0,
    remarks: ''
  })

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.student?.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesResult = filterResult ? 
      (filterResult === 'passed' ? result.isPassed : !result.isPassed) : true
    
    return matchesSearch && matchesResult
  })

  const handleEditMarks = (result) => {
    setSelectedResult(result)
    setMarksForm({
      obtainedMarks: result.obtainedMarks,
      remarks: result.remarks || ''
    })
    setShowMarksModal(true)
  }

  const handleSaveMarks = () => {
    onUpdateMarks(selectedResult._id, marksForm)
    setShowMarksModal(false)
  }

  const handleDownloadReport = () => {
    onDownload(selectedExam?._id)
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'success'
    if (percentage >= 60) return 'info'
    if (percentage >= 40) return 'warning'
    return 'danger'
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Results Management</h5>
              {selectedExam && (
                <small className="text-muted">
                  Exam: {selectedExam.examName} | Total Students: {results.length}
                </small>
              )}
            </div>
            <div className="d-flex gap-2">
              {selectedExam && (
                <>
                  {selectedExam.isResultPublished ? (
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => onUnpublish(selectedExam._id)}
                    >
                      <FaToggleOff className="me-2" />
                      Unpublish Results
                    </Button>
                  ) : (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => onPublish(selectedExam._id)}
                    >
                      <FaToggleOn className="me-2" />
                      Publish Results
                    </Button>
                  )}
                  <Button 
                    variant="info" 
                    size="sm"
                    onClick={handleDownloadReport}
                  >
                    <FaDownload className="me-2" />
                    Download Report
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="d-flex gap-2 mt-3">
            <div style={{ width: '300px' }}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div style={{ width: '150px' }}>
              <Form.Select
                size="sm"
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
              >
                <option value="">All Results</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table striped hover responsive size="sm">
            <thead className="sticky-top bg-white">
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
                    <span className={`badge bg-${getPercentageColor(result.percentage)}`}>
                      {result.percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    {result.isPassed ? (
                      <Badge bg="success">
                        <FaCheck className="me-1" />
                        PASS
                      </Badge>
                    ) : (
                      <Badge bg="danger">
                        <FaTimes className="me-1" />
                        FAIL
                      </Badge>
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
                      onClick={() => onViewDetails(result)}
                    >
                      <FaEye />
                    </Button>
                    {!selectedExam?.isResultPublished && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleEditMarks(result)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <p className="text-muted mb-0">No results found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Edit Marks Modal */}
      <Modal show={showMarksModal} onHide={() => setShowMarksModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Student</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedResult.student?.name}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Total Marks</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedResult.totalMarks}
                  disabled
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Obtained Marks</Form.Label>
                <Form.Control
                  type="number"
                  value={marksForm.obtainedMarks}
                  onChange={(e) => setMarksForm({ 
                    ...marksForm, 
                    obtainedMarks: parseFloat(e.target.value) 
                  })}
                  min="0"
                  max={selectedResult.totalMarks}
                  step="0.5"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={marksForm.remarks}
                  onChange={(e) => setMarksForm({ 
                    ...marksForm, 
                    remarks: e.target.value 
                  })}
                  placeholder="Add remarks (optional)"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMarksModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveMarks}>
            Update Marks
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default ResultManagement