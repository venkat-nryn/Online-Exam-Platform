import React, { useState } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap'
import { FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa'

const GroupManagement = ({ groups, onEdit, onDelete, onView }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.year.includes(searchTerm) ||
    group.batch.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Groups List</h5>
        <div style={{ width: '300px' }}>
          <InputGroup size="sm">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>
      </Card.Header>
      <Card.Body>
        <Table striped hover responsive size="sm">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Year</th>
              <th>Batch</th>
              <th>Section</th>
              <th>Students</th>
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
                <td>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => onView(group)}
                  >
                    <FaEye />
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(group)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(group)}
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

export default GroupManagement