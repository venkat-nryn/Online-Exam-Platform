import React, { useState } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap'
import { FaEdit, FaTrash, FaSearch, FaPlus, FaUpload, FaEye, FaCheck, FaTimes } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

const QuestionBank = ({ questions, onAdd, onEdit, onDelete, onBulkUpload }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterExam, setFilterExam] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [formData, setFormData] = useState({
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    marks: '',
    exam: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('options.')) {
      const option = name.split('.')[1]
      setFormData({
        ...formData,
        options: {
          ...formData.options,
          [option]: value
        }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = () => {
    // Validate form
    if (!formData.question || !formData.options.A || !formData.options.B || 
        !formData.options.C || !formData.options.D || !formData.marks) {
      toast.error('Please fill all fields')
      return
    }

    onAdd(formData)
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      marks: '',
      exam: ''
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const importedQuestions = jsonData.map(row => ({
          question: row.Question,
          options: {
            A: row.OptionA,
            B: row.OptionB,
            C: row.OptionC,
            D: row.OptionD
          },
          correctAnswer: row.CorrectAnswer,
          marks: parseFloat(row.Marks)
        }))

        onBulkUpload(importedQuestions)
        toast.success(`${importedQuestions.length} questions imported`)
      } catch (error) {
        toast.error('Failed to parse Excel file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesExam = filterExam ? q.exam === filterExam : true
    return matchesSearch && matchesExam
  })

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Question Bank</h5>
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                size="sm"
                as="label"
              >
                <FaUpload className="me-2" />
                Import Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                />
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
              >
                <FaPlus className="me-2" />
                Add Question
              </Button>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <div style={{ width: '300px' }}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div style={{ width: '200px' }}>
              <Form.Select
                size="sm"
                value={filterExam}
                onChange={(e) => setFilterExam(e.target.value)}
              >
                <option value="">All Exams</option>
                {/* Add exam options dynamically */}
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table striped hover responsive size="sm">
            <thead className="sticky-top bg-white">
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Options</th>
                <th>Correct</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q, index) => (
                <tr key={q._id || index}>
                  <td>{index + 1}</td>
                  <td>{q.question.substring(0, 50)}...</td>
                  <td>
                    <div className="small">
                      <div>A: {q.options.A.substring(0, 20)}...</div>
                      <div>B: {q.options.B.substring(0, 20)}...</div>
                      <div>C: {q.options.C.substring(0, 20)}...</div>
                      <div>D: {q.options.D.substring(0, 20)}...</div>
                    </div>
                  </td>
                  <td>
                    <Badge bg="success">{q.correctAnswer}</Badge>
                  </td>
                  <td>{q.marks}</td>
                  <td>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setSelectedQuestion(q)
                        setShowViewModal(true)
                      }}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setFormData(q)
                        setShowModal(true)
                      }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDelete(q)}
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

      {/* Add/Edit Question Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{formData._id ? 'Edit Question' : 'Add New Question'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Question</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="Enter question"
              />
            </Form.Group>

            <Row>
              {['A', 'B', 'C', 'D'].map(option => (
                <Col md={6} key={option}>
                  <Form.Group className="mb-3">
                    <Form.Label>Option {option}</Form.Label>
                    <Form.Control
                      type="text"
                      name={`options.${option}`}
                      value={formData.options[option]}
                      onChange={handleInputChange}
                      placeholder={`Enter option ${option}`}
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Correct Answer</Form.Label>
                  <Form.Select
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleInputChange}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marks</Form.Label>
                  <Form.Control
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleInputChange}
                    placeholder="Enter marks"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {formData._id ? 'Update' : 'Add'} Question
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Question Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Question Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuestion && (
            <>
              <h6>Question:</h6>
              <p>{selectedQuestion.question}</p>

              <h6>Options:</h6>
              <div className="mb-3">
                {['A', 'B', 'C', 'D'].map(option => (
                  <div key={option} className="mb-2">
                    <strong>{option}:</strong> {selectedQuestion.options[option]}
                    {selectedQuestion.correctAnswer === option && (
                      <FaCheck className="text-success ms-2" />
                    )}
                  </div>
                ))}
              </div>

              <p><strong>Marks:</strong> {selectedQuestion.marks}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default QuestionBank