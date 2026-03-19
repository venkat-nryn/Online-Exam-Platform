import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaUpload, FaToggleOn, FaToggleOff } from 'react-icons/fa'
import studentService from '../../services/studentService'
import groupService from '../../services/groupService'
import { validateStudent } from '../../utils/validation'
import toast from 'react-hot-toast'
import { saveAs } from 'file-saver'

const AdminStudents = () => {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    password: '',
    group: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, groupsRes] = await Promise.all([
        studentService.getAllStudents(),
        groupService.getAllGroups()
      ])
      setStudents(studentsRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async () => {
    const validationErrors = validateStudent(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (selectedStudent) {
        await studentService.updateStudent(selectedStudent._id, formData)
        toast.success('Student updated successfully')
      } else {
        await studentService.createStudent(formData)
        toast.success('Student created successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await studentService.deleteStudent(selectedStudent._id)
      toast.success('Student deleted successfully')
      setShowDeleteModal(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student')
    }
  }

  const handleToggleStatus = async (student) => {
    try {
      await studentService.toggleStudentStatus(student._id)
      toast.success(`Student ${student.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchData()
    } catch (error) {
      toast.error('Failed to toggle student status')
    }
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      password: '',
      group: student.group?._id || '',
      isActive: student.isActive
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      email: '',
      password: '',
      group: '',
      isActive: true
    })
    setSelectedStudent(null)
    setErrors({})
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      await studentService.bulkCreateStudents(file)
      toast.success('Students imported successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import students')
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = filterGroup ? student.group?._id === filterGroup : true
    
    return matchesSearch && matchesGroup
  })

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading students...</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Management</h2>
        <div className="d-flex gap-2">
          <Button variant="primary" as="label">
            <FaUpload className="me-2" />
            Import Excel
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </Button>
          <Button variant="primary" onClick={() => {
            resetForm()
            setShowModal(true)
          }}>
            <FaPlus className="me-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name, roll number, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.groupName} ({group.year})
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Students Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table striped hover responsive>
            <thead className="bg-primary text-white">
              <tr>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Group</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td className="fw-semibold">{student.name}</td>
                  <td>{student.rollNumber}</td>
                  <td>{student.email}</td>
                  <td>
                    <Badge bg="info">
                      {student.group?.groupName || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={student.isActive ? 'success' : 'secondary'}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(student)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleToggleStatus(student)}
                    >
                      {student.isActive ? <FaToggleOff /> : <FaToggleOn />}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(student)
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

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedStudent ? 'Edit Student' : 'Create New Student'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.name}
                    placeholder="Enter full name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    isInvalid={!!errors.rollNumber}
                    placeholder="Enter roll number"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.rollNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter email address"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {!selectedStudent && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    isInvalid={!!errors.password}
                    placeholder={selectedStudent ? "Leave blank to keep current" : "Enter password"}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Group <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    isInvalid={!!errors.group}
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>
                        {group.groupName} ({group.year} - {group.batch} - {group.section})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.group}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div>
                    <Form.Check
                      type="switch"
                      id="active-switch"
                      label={formData.isActive ? 'Active' : 'Inactive'}
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  </div>
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
            {selectedStudent ? 'Update' : 'Create'} Student
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete student "{selectedStudent?.name}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Student
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default AdminStudents