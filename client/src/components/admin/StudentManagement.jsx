import React, { useState } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap'
import { FaEdit, FaTrash, FaSearch, FaToggleOn, FaToggleOff } from 'react-icons/fa'

const StudentManagement = ({ students, groups, onEdit, onDelete, onToggleStatus }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = filterGroup ? student.group?._id === filterGroup : true
    
    return matchesSearch && matchesGroup
  })

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Students List</h5>
          <div className="d-flex gap-2">
            <div style={{ width: '200px' }}>
              <Form.Select
                size="sm"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div style={{ width: '250px' }}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search students..."
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
              <th>Name</th>
              <th>Roll Number</th>
              <th>Email</th>
              <th>Group</th>
              <th>Status</th>
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
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(student)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => onToggleStatus(student)}
                  >
                    {student.isActive ? <FaToggleOff /> : <FaToggleOn />}
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(student)}
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

export default StudentManagement