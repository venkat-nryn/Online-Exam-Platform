import React, { useState } from 'react'
import { Card, Form, Button, Row, Col, Table, Badge, Spinner } from 'react-bootstrap'
import { FaDownload, FaFileCsv, FaFileExcel, FaChartBar, FaCalendar, FaUsers, FaFileAlt } from 'react-icons/fa'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const ReportGeneration = ({ 
  reportType, 
  onGenerate, 
  onDownload,
  groups = [],
  exams = [],
  loading = false,
  data = null 
}) => {
  const [filters, setFilters] = useState({
    group: '',
    exam: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    isPassed: ''
  })

  const handleGenerate = () => {
    onGenerate(filters)
  }

  const handleDownload = (format) => {
    onDownload(filters, format)
  }

  const getReportTitle = () => {
    switch(reportType) {
      case 'students': return 'Student Report'
      case 'exams': return 'Exam Report'
      case 'results': return 'Results Report'
      default: return 'Report'
    }
  }

  const renderFilters = () => {
    switch(reportType) {
      case 'students':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Group</Form.Label>
              <Form.Select
                value={filters.group}
                onChange={(e) => setFilters({ ...filters, group: e.target.value })}
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </>
        )

      case 'exams':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Exam Status</Form.Label>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date Range</Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Control
                    type="date"
                    placeholder="From"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="date"
                    placeholder="To"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </Col>
              </Row>
            </Form.Group>
          </>
        )

      case 'results':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Exam</Form.Label>
              <Form.Select
                value={filters.exam}
                onChange={(e) => setFilters({ ...filters, exam: e.target.value })}
              >
                <option value="">All Exams</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Result</Form.Label>
              <Form.Select
                value={filters.isPassed}
                onChange={(e) => setFilters({ ...filters, isPassed: e.target.value })}
              >
                <option value="">All</option>
                <option value="true">Passed</option>
                <option value="false">Failed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date Range</Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Control
                    type="date"
                    placeholder="From"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="date"
                    placeholder="To"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </Col>
              </Row>
            </Form.Group>
          </>
        )

      default:
        return null
    }
  }

  const renderPreview = () => {
    if (!data) return null

    const headers = data.length > 0 ? Object.keys(data[0]) : []

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="bg-primary text-white">
              <Card.Body>
                <h6>Total Records</h6>
                <h3>{data.length}</h3>
              </Card.Body>
            </Card>
          </Col>
          
          {reportType === 'students' && (
            <>
              <Col md={3}>
                <Card className="bg-success text-white">
                  <Card.Body>
                    <h6>Active</h6>
                    <h3>{data.filter(s => s.isActive).length}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-danger text-white">
                  <Card.Body>
                    <h6>Inactive</h6>
                    <h3>{data.filter(s => !s.isActive).length}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}

          {reportType === 'exams' && (
            <>
              <Col md={3}>
                <Card className="bg-success text-white">
                  <Card.Body>
                    <h6>Published</h6>
                    <h3>{data.filter(e => e.status === 'published').length}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-warning text-white">
                  <Card.Body>
                    <h6>Draft</h6>
                    <h3>{data.filter(e => e.status === 'draft').length}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}

          {reportType === 'results' && (
            <>
              <Col md={3}>
                <Card className="bg-success text-white">
                  <Card.Body>
                    <h6>Passed</h6>
                    <h3>{data.filter(r => r.isPassed).length}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-danger text-white">
                  <Card.Body>
                    <h6>Failed</h6>
                    <h3>{data.filter(r => !r.isPassed).length}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}
        </Row>

        <Card>
          <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <Table striped hover size="sm">
              <thead className="sticky-top bg-white">
                <tr>
                  {headers.map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    {headers.map(header => (
                      <td key={header}>
                        {typeof row[header] === 'boolean' ? (
                          <Badge bg={row[header] ? 'success' : 'secondary'}>
                            {row[header] ? 'Yes' : 'No'}
                          </Badge>
                        ) : row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            {data.length > 10 && (
              <p className="text-muted text-center mt-2">
                Showing 10 of {data.length} records
              </p>
            )}
          </Card.Body>
        </Card>
      </>
    )
  }

  return (
    <Row>
      <Col md={4}>
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">{getReportTitle()} - Filters</h5>
          </Card.Header>
          <Card.Body>
            <Form>
              {renderFilters()}

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
                
                {data && (
                  <div className="d-flex gap-2 mt-2">
                    <Button 
                      variant="success" 
                      className="flex-grow-1"
                      onClick={() => handleDownload('csv')}
                    >
                      <FaFileCsv className="me-2" />
                      CSV
                    </Button>
                    <Button 
                      variant="info" 
                      className="flex-grow-1"
                      onClick={() => handleDownload('excel')}
                    >
                      <FaFileExcel className="me-2" />
                      Excel
                    </Button>
                  </div>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col md={8}>
        {loading ? (
          <Card className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Generating report...</p>
          </Card>
        ) : data ? (
          renderPreview()
        ) : (
          <Card className="text-center py-5">
            <Card.Body>
              <FaChartBar size={50} className="text-muted mb-3" />
              <h5>No Report Generated</h5>
              <p className="text-muted">
                Select filters and click "Generate Report" to view data
              </p>
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  )
}

export default ReportGeneration