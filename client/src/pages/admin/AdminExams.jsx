import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup, Tabs, Tab } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUpload, FaEye, FaCopy, FaPlay, FaStop, FaQuestionCircle } from 'react-icons/fa'
import examService from '../../services/examService'
import groupService from '../../services/groupService'
import studentService from '../../services/studentService'
import { validateExam, validateQuestion } from '../../utils/validation'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const AdminExams = () => {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  
  // Exam Form State
  const [formData, setFormData] = useState({
    examName: '',
    date: '',
    startTime: '',
    duration: '',
    passMark: '',
    totalMarks: '',
    instructions: '',
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      enableFullScreen: true,
      enableTabSwitchDetection: true,
      autoSubmitOnViolation: true,
      maxViolations: 3
    }
  })

  // Questions State
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    marks: ''
  })

  // Assignment State
  const [assignmentData, setAssignmentData] = useState({
    examId: '',
    studentIds: [],
    groupIds: []
  })

  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [examsRes, groupsRes, studentsRes] = await Promise.all([
        examService.getAllExams(),
        groupService.getAllGroups(),
        studentService.getAllStudents()
      ])
      setExams(examsRes.data)
      setGroups(groupsRes.data)
      setStudents(studentsRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSettingChange = (setting) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [setting]: !formData.settings[setting]
      }
    })
  }

  const handleQuestionChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('options.')) {
      const option = name.split('.')[1]
      setCurrentQuestion({
        ...currentQuestion,
        options: {
          ...currentQuestion.options,
          [option]: value
        }
      })
    } else {
      setCurrentQuestion({ ...currentQuestion, [name]: value })
    }
  }

  const handleAddQuestion = () => {
    const validationErrors = validateQuestion(currentQuestion)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fill all question fields correctly')
      return
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now() }])
    setCurrentQuestion({
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      marks: ''
    })
  }

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmitExam = async () => {
    // Validate exam details
    const validationErrors = validateExam(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fill all required fields')
      return
    }

    // Validate questions
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    // Calculate total marks from questions
    const totalMarksFromQuestions = questions.reduce((sum, q) => sum + parseFloat(q.marks), 0)
    if (totalMarksFromQuestions !== parseFloat(formData.totalMarks)) {
      toast.error(`Total marks from questions (${totalMarksFromQuestions}) does not match exam total marks (${formData.totalMarks})`)
      return
    }

    try {
      // Create exam
      const examResponse = await examService.createExam(formData)
      const examId = examResponse.data._id

      // Add questions
      const cleanQuestions = questions.map(({ id, ...q }) => ({ ...q, marks: Number(q.marks) }))
      await examService.addQuestions(examId, cleanQuestions)

      toast.success('Exam created successfully')
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam')
    }
  }

  const handleFileUpload = async (e) => {
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

        setQuestions([...questions, ...importedQuestions])
        toast.success(`${importedQuestions.length} questions imported`)
      } catch (error) {
        toast.error('Failed to parse Excel file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleAssignExam = async () => {
    if (!assignmentData.examId) {
      toast.error('Please select an exam')
      return
    }

    if (assignmentData.studentIds.length === 0 && assignmentData.groupIds.length === 0) {
      toast.error('Please select at least one student or group')
      return
    }

    try {
      await examService.assignExam(assignmentData)
      toast.success('Exam assigned successfully')
      setShowAssignModal(false)
      setAssignmentData({ examId: '', studentIds: [], groupIds: [] })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign exam')
    }
  }

  const handleToggleExamStatus = async (exam) => {
    try {
      await examService.updateExam(exam._id, { status: exam.status === 'published' ? 'draft' : 'published' })
      toast.success(`Exam ${exam.status === 'published' ? 'unpublished' : 'published'} successfully`)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update exam status')
    }
  }

  const handleViewExamDetails = async (examId) => {
    try {
      const response = await examService.getExam(examId)
      setSelectedExam(response.data)
      setShowQuestionModal(true)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load exam details')
    }
  }

  const handleDeleteExam = async () => {
    if (!selectedExam?._id) {
      return
    }

    try {
      await examService.deleteExam(selectedExam._id)
      toast.success('Exam deleted successfully')
      setShowDeleteModal(false)
      setSelectedExam(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete exam')
    }
  }

  const resetForm = () => {
    setFormData({
      examName: '',
      date: '',
      startTime: '',
      duration: '',
      passMark: '',
      totalMarks: '',
      instructions: '',
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        enableFullScreen: true,
        enableTabSwitchDetection: true,
        autoSubmitOnViolation: true,
        maxViolations: 3
      }
    })
    setQuestions([])
    setSelectedExam(null)
    setErrors({})
  }

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      published: 'success',
      'in-progress': 'warning',
      completed: 'info'
    }
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>
  }

  const filteredExams = exams.filter(exam =>
    exam.examName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Exam Management</h2>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => setShowAssignModal(true)}>
            <FaCopy className="me-2" />
            Assign Exam
          </Button>
          <Button variant="primary" onClick={() => {
            resetForm()
            setShowModal(true)
          }}>
            <FaPlus className="me-2" />
            Create Exam
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
      <Card className="shadow-sm">
        <Card.Body>
          <Table striped hover responsive>
            <thead className="bg-primary text-white">
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
                      onClick={() => handleViewExamDetails(exam._id)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleToggleExamStatus(exam)}
                    >
                      {exam.status === 'published' ? <FaStop /> : <FaPlay />}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedExam(exam)
                        setShowDeleteModal(true)
                      }}
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

      {/* Create Exam Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create New Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="details" title="Exam Details">
              <Form>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Exam Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="examName"
                        value={formData.examName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.examName}
                        placeholder="Enter exam name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.examName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        isInvalid={!!errors.date}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        isInvalid={!!errors.startTime}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.startTime}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        isInvalid={!!errors.duration}
                        placeholder="e.g., 120"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.duration}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Marks <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="totalMarks"
                        value={formData.totalMarks}
                        onChange={handleInputChange}
                        isInvalid={!!errors.totalMarks}
                        placeholder="e.g., 100"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.totalMarks}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pass Mark <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="passMark"
                        value={formData.passMark}
                        onChange={handleInputChange}
                        isInvalid={!!errors.passMark}
                        placeholder="e.g., 40"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.passMark}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Instructions</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        placeholder="Enter exam instructions for students"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <h5 className="mb-3">Exam Settings</h5>
                    <Row>
                      <Col md={4}>
                        <Form.Check
                          type="switch"
                          id="shuffle-questions"
                          label="Shuffle Questions"
                          checked={formData.settings.shuffleQuestions}
                          onChange={() => handleSettingChange('shuffleQuestions')}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="switch"
                          id="shuffle-options"
                          label="Shuffle Options"
                          checked={formData.settings.shuffleOptions}
                          onChange={() => handleSettingChange('shuffleOptions')}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="switch"
                          id="fullscreen"
                          label="Enable Full Screen"
                          checked={formData.settings.enableFullScreen}
                          onChange={() => handleSettingChange('enableFullScreen')}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="switch"
                          id="tab-detection"
                          label="Detect Tab Switch"
                          checked={formData.settings.enableTabSwitchDetection}
                          onChange={() => handleSettingChange('enableTabSwitchDetection')}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Check
                          type="switch"
                          id="auto-submit"
                          label="Auto Submit on Violation"
                          checked={formData.settings.autoSubmitOnViolation}
                          onChange={() => handleSettingChange('autoSubmitOnViolation')}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Max Violations</Form.Label>
                          <Form.Control
                            type="number"
                            name="settings.maxViolations"
                            value={formData.settings.maxViolations}
                            onChange={handleInputChange}
                            min="1"
                            max="10"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Form>
            </Tab>

            <Tab eventKey="questions" title="Questions">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Add Questions</h5>
                  <div>
                    <Button
                      variant="success"
                      as="label"
                      className="me-2"
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
                  </div>
                </div>

                {/* Question Form */}
                <Card className="mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Question</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="question"
                            value={currentQuestion.question}
                            onChange={handleQuestionChange}
                            placeholder="Enter question"
                          />
                        </Form.Group>
                      </Col>

                      {['A', 'B', 'C', 'D'].map(option => (
                        <Col md={6} key={option}>
                          <Form.Group className="mb-3">
                            <Form.Label>Option {option}</Form.Label>
                            <Form.Control
                              type="text"
                              name={`options.${option}`}
                              value={currentQuestion.options[option]}
                              onChange={handleQuestionChange}
                              placeholder={`Enter option ${option}`}
                            />
                          </Form.Group>
                        </Col>
                      ))}

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Correct Answer</Form.Label>
                          <Form.Select
                            name="correctAnswer"
                            value={currentQuestion.correctAnswer}
                            onChange={handleQuestionChange}
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
                            value={currentQuestion.marks}
                            onChange={handleQuestionChange}
                            placeholder="Enter marks"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Button variant="primary" onClick={handleAddQuestion}>
                          Add Question
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Questions List */}
                <h5>Added Questions ({questions.length})</h5>
                {questions.map((q, index) => (
                  <Card key={q.id} className="mb-2">
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>Q{index + 1}:</strong> {q.question}
                          <div className="mt-2 small">
                            <span className="me-3">A: {q.options.A}</span>
                            <span className="me-3">B: {q.options.B}</span>
                            <span className="me-3">C: {q.options.C}</span>
                            <span className="me-3">D: {q.options.D}</span>
                          </div>
                          <div className="mt-2">
                            <Badge bg="success">Correct: {q.correctAnswer}</Badge>
                            <Badge bg="info" className="ms-2">Marks: {q.marks}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitExam}>
            Create Exam
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Exam Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Exam</Form.Label>
              <Form.Select
                value={assignmentData.examId}
                onChange={(e) => setAssignmentData({ ...assignmentData, examId: e.target.value })}
              >
                <option value="">Choose an exam</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName} ({formatDate(exam.date)})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <h5 className="mb-3">Assign to Groups</h5>
            <Row className="mb-4">
              {groups.map(group => (
                <Col md={4} key={group._id}>
                  <Form.Check
                    type="checkbox"
                    id={`group-${group._id}`}
                    label={`${group.groupName} (${group.year})`}
                    checked={assignmentData.groupIds.includes(group._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignmentData({
                          ...assignmentData,
                          groupIds: [...assignmentData.groupIds, group._id]
                        })
                      } else {
                        setAssignmentData({
                          ...assignmentData,
                          groupIds: assignmentData.groupIds.filter(id => id !== group._id)
                        })
                      }
                    }}
                  />
                </Col>
              ))}
            </Row>

            <h5 className="mb-3">Assign to Individual Students</h5>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Search students..."
                onChange={(e) => {
                  // Implement student search
                }}
              />
            </Form.Group>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {students.map(student => (
                <Form.Check
                  key={student._id}
                  type="checkbox"
                  id={`student-${student._id}`}
                  label={`${student.name} (${student.rollNumber})`}
                  checked={assignmentData.studentIds.includes(student._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAssignmentData({
                        ...assignmentData,
                        studentIds: [...assignmentData.studentIds, student._id]
                      })
                    } else {
                      setAssignmentData({
                        ...assignmentData,
                        studentIds: assignmentData.studentIds.filter(id => id !== student._id)
                      })
                    }
                  }}
                />
              ))}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAssignExam}>
            Assign Exam
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Exam Modal */}
      <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Exam Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedExam?.exam ? (
            <>
              <h5 className="mb-3">{selectedExam.exam.examName}</h5>
              <p className="mb-1"><strong>Date:</strong> {formatDate(selectedExam.exam.date)}</p>
              <p className="mb-1"><strong>Time:</strong> {formatTime(selectedExam.exam.startTime)}</p>
              <p className="mb-3"><strong>Duration:</strong> {selectedExam.exam.duration} mins</p>

              <h6>Questions ({selectedExam.questions?.length || 0})</h6>
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {(selectedExam.questions || []).map((q, index) => (
                  <Card key={q._id || index} className="mb-2">
                    <Card.Body>
                      <div className="fw-semibold mb-2">Q{index + 1}. {q.question}</div>
                      <div className="small mb-2">A: {q.options?.A}</div>
                      <div className="small mb-2">B: {q.options?.B}</div>
                      <div className="small mb-2">C: {q.options?.C}</div>
                      <div className="small mb-2">D: {q.options?.D}</div>
                      <Badge bg="success" className="me-2">Correct: {q.correctAnswer}</Badge>
                      <Badge bg="info">Marks: {q.marks}</Badge>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="mb-0">No exam details available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Exam</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{selectedExam?.examName || 'this exam'}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteExam}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default AdminExams