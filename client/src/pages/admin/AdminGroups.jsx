import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, InputGroup } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaUpload, FaEye } from 'react-icons/fa'
import groupService from '../../services/groupService'
import { validateGroup } from '../../utils/validation'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const AdminGroups = () => {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [formData, setFormData] = useState({
    groupName: '',
    year: '',
    batch: '',
    section: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await groupService.getAllGroups()
      setGroups(response.data)
    } catch (error) {
      toast.error('Failed to fetch groups')
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupStats = async (groupId) => {
    try {
      const response = await groupService.getGroupStats(groupId)
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to fetch group statistics')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateGroup(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (selectedGroup) {
        // Update group
        await groupService.updateGroup(selectedGroup._id, formData)
        toast.success('Group updated successfully')
      } else {
        // Create group
        await groupService.createGroup(formData)
        toast.success('Group created successfully')
      }
      
      setShowModal(false)
      resetForm()
      fetchGroups()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await groupService.deleteGroup(selectedGroup._id)
      toast.success('Group deleted successfully')
      setShowDeleteModal(false)
      fetchGroups()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group')
    }
  }

  const handleView = async (group) => {
    setSelectedGroup(group)
    await fetchGroupStats(group._id)
    setShowViewModal(true)
  }

  const handleEdit = (group) => {
    setSelectedGroup(group)
    setFormData({
      groupName: group.groupName,
      year: group.year,
      batch: group.batch,
      section: group.section,
      description: group.description || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      groupName: '',
      year: '',
      batch: '',
      section: '',
      description: ''
    })
    setSelectedGroup(null)
    setErrors({})
  }

  const handleExport = async (format = 'csv') => {
    try {
      const data = await groupService.exportGroups(format)
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      saveAs(blob, `groups_export_${Date.now()}.${format}`)
      toast.success('Groups exported successfully')
    } catch (error) {
      toast.error('Failed to export groups')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      await groupService.bulkCreateGroups(file)
      toast.success('Groups imported successfully')
      fetchGroups()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import groups')
    }
  }

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.year.includes(searchTerm) ||
    group.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.section.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading groups...</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Group Management</h2>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => handleExport('csv')}>
            <FaDownload className="me-2" />
            Export CSV
          </Button>
          <Button variant="info" onClick={() => handleExport('excel')}>
            <FaDownload className="me-2" />
            Export Excel
          </Button>
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
            Add Group
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <InputGroup className="mb-4">
        <InputGroup.Text>
          <FaSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Search groups by name, year, batch, section..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {/* Groups Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table striped hover responsive>
            <thead className="bg-primary text-white">
              <tr>
                <th>Group Name</th>
                <th>Year</th>
                <th>Batch</th>
                <th>Section</th>
                <th>Students</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group._id}>
                  <td className="fw-semibold">{group.groupName}</td>
                  <td>{group.year}</td>
                  <td>{group.batch}</td>
                  <td>{group.section}</td>
                  <td>
                    <Badge bg="info">{group.studentCount || 0}</Badge>
                  </td>
                  <td>{group.description || '-'}</td>
                  <td>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => handleView(group)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(group)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group)
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
          <Modal.Title>{selectedGroup ? 'Edit Group' : 'Create New Group'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Group Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="groupName"
                    value={formData.groupName}
                    onChange={handleInputChange}
                    isInvalid={!!errors.groupName}
                    placeholder="Enter group name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.groupName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    isInvalid={!!errors.year}
                    placeholder="e.g., 2025"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.year}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Batch <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleInputChange}
                    isInvalid={!!errors.batch}
                    placeholder="e.g., Batch A"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.batch}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    isInvalid={!!errors.section}
                    placeholder="e.g., Section C"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.section}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter group description (optional)"
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
            {selectedGroup ? 'Update' : 'Create'} Group
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Group Details: {selectedGroup?.groupName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stats && (
            <Row>
              <Col md={6}>
                <Card className="bg-primary text-white mb-3">
                  <Card.Body>
                    <h6>Total Students</h6>
                    <h2>{stats.totalStudents}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="bg-success text-white mb-3">
                  <Card.Body>
                    <h6>Active Students</h6>
                    <h2>{stats.activeStudents}</h2>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={12}>
                <h5 className="mt-3 mb-3">Exam Statistics</h5>
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.examStats || {}).map(([status, count]) => (
                      <tr key={status}>
                        <td className="text-capitalize">{status}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the group "{selectedGroup?.groupName}"?
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Group
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default AdminGroups