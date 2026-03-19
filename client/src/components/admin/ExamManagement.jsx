import React, { useState } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap'
import { FaEdit, FaTrash, FaSearch, FaEye, FaCopy, FaPlay, FaStop } from 'react-icons/fa'
import { formatDate, formatTime } from '../../utils/helpers'

const ExamManagement = ({ exams, onEdit, onDelete, onView, onAssign, onToggleStatus }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.examName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus ? exam.status === filterStatus : true
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      published: 'success',
      'in-progress': 'warning',
      completed: 'info'
    }
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Exams List</h5>
          <div className="d-flex gap-2">
            <div style={{ width: '150px' }}>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </div>
            <div style={{ width: '250px' }}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </Card.Header>
      <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Table striped hover responsive size="sm">
          <thead className="sticky-top bg-white">
            <tr>
              <th>Exam Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Total Marks</th>
              <th>Questions</th>
              <th>Status</th>
              <th>Results</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam._id}>
                <td className="fw-semibold">{exam.examName}</td>
                <td>{formatDate(exam.date)}</td>
                <td>{formatTime(exam.startTime)}</td>
                <td>{exam.duration} mins</td>
                <td>{exam.totalMarks}</td>
                <td>
                  <Badge bg="info">{exam.questionCount || 0}</Badge>
                </td>
                <td>{getStatusBadge(exam.status)}</td>
                <td>
                  {exam.isResultPublished ? (
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
                    onClick={() => onView(exam)}
                  >
                    <FaEye />
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={() => onAssign(exam)}
                  >
                    <FaCopy />
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => onToggleStatus(exam)}
                  >
                    {exam.status === 'published' ? <FaStop /> : <FaPlay />}
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(exam)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(exam)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}

export default ExamManagement