import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Spinner, InputGroup, Badge } from 'react-bootstrap'
import { FaDownload, FaFileCsv, FaFileExcel, FaChartBar, FaCalendar, FaUsers, FaFileAlt } from 'react-icons/fa'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import reportService from '../../services/reportService'
import groupService from '../../services/groupService'
import examService from '../../services/examService'
import { formatDate } from '../../utils/helpers'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const AdminReports = () => {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState([])
  const [exams, setExams] = useState([])
  const [reportType, setReportType] = useState('students')
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    group: '',
    exam: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    isPassed: ''
  })

  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const [groupsRes, examsRes] = await Promise.all([
        groupService.getAllGroups(),
        examService.getAllExams()
      ])
      setGroups(groupsRes.data)
      setExams(examsRes.data)
    } catch (error) {
      toast.error('Failed to fetch filter data')
    }
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      let response
      const reportFilters = {}
      
      // Add non-empty filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) reportFilters[key] = value
      })

      switch(reportType) {
        case 'students':
          response = await reportService.generateStudentReport({
            fields: ['name', 'rollNumber', 'email', 'group.groupName', 'isActive', 'lastLogin', 'examAttempts', 'averageScore'],
            filters: reportFilters
          })
          break
        case 'exams':
          response = await reportService.generateExamReport({
            fields: ['examName', 'date', 'duration', 'totalMarks', 'passMark', 'status', 'questionCount', 'totalAttempts', 'averageScore', 'passCount', 'failCount'],
            filters: reportFilters
          })
          break
        case 'results':
          response = await reportService.generateResultReport({
            fields: ['studentName', 'rollNumber', 'examName', 'obtainedMarks', 'totalMarks', 'percentage', 'isPassed', 'publishedAt'],
            filters: reportFilters
          })
          break
      }
      
      setReportData(response.data)
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format) => {
    try {
      let blob
      let filename
      
      switch(reportType) {
        case 'students':
          const studentsRes = await reportService.generateStudentReport({
            fields: ['name', 'rollNumber', 'email', 'group.groupName', 'isActive', 'lastLogin', 'examAttempts', 'averageScore'],
            filters,
            format
          })
          blob = new Blob([studentsRes], { 
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          filename = `students_report_${Date.now()}.${format}`
          break
          
        case 'exams':
          const examsRes = await reportService.generateExamReport({
            fields: ['examName', 'date', 'duration', 'totalMarks', 'passMark', 'status', 'questionCount', 'totalAttempts', 'averageScore', 'passCount', 'failCount'],
            filters,
            format
          })
          blob = new Blob([examsRes], { 
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          filename = `exams_report_${Date.now()}.${format}`
          break
          
        case 'results':
          const resultsRes = await reportService.generateResultReport({
            fields: ['studentName', 'rollNumber', 'examName', 'obtainedMarks', 'totalMarks', 'percentage', 'isPassed', 'publishedAt'],
            filters,
            format
          })
          blob = new Blob([resultsRes], { 
            type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          filename = `results_report_${Date.now()}.${format}`
          break
      }
      
      saveAs(blob, filename)
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const handleExportAll = async () => {
    try {
      const data = await reportService.exportAllData()
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `complete_export_${Date.now()}.xlsx`)
      toast.success('All data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  const getChartData = () => {
    if (!reportData) return null

    switch(reportType) {
      case 'students':
        return {
          labels: ['Active', 'Inactive'],
          datasets: [{
            data: [
              reportData.filter(s => s.isActive).length,
              reportData.filter(s => !s.isActive).length
            ],
            backgroundColor: ['#198754', '#dc3545']
          }]
        }
        
      case 'exams':
        return {
          labels: ['Published', 'Draft', 'Completed'],
          datasets: [{
            data: [
              reportData.filter(e => e.status === 'published').length,
              reportData.filter(e => e.status === 'draft').length,
              reportData.filter(e => e.status === 'completed').length
            ],
            backgroundColor: ['#198754', '#ffc107', '#0dcaf0']
          }]
        }
        
      case 'results':
        return {
          labels: ['Passed', 'Failed'],
          datasets: [{
            data: [
              reportData.filter(r => r.isPassed).length,
              reportData.filter(r => !r.isPassed).length
            ],
            backgroundColor: ['#198754', '#dc3545']
          }]
        }
        
      default:
        return null
    }
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Reports & Analytics</h2>
        <Button variant="success" onClick={handleExportAll}>
          <FaDownload className="me-2" />
          Export All Data
        </Button>
      </div>

      <Row>
        {/* Report Controls */}
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Generate Report</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Report Type</Form.Label>
                  <div className="d-flex gap-2">
                    <Button
                      variant={reportType === 'students' ? 'primary' : 'outline-primary'}
                      onClick={() => setReportType('students')}
                      className="flex-grow-1"
                    >
                      <FaUsers className="me-2" />
                      Students
                    </Button>
                    <Button
                      variant={reportType === 'exams' ? 'primary' : 'outline-primary'}
                      onClick={() => setReportType('exams')}
                      className="flex-grow-1"
                    >
                      <FaFileAlt className="me-2" />
                      Exams
                    </Button>
                    <Button
                      variant={reportType === 'results' ? 'primary' : 'outline-primary'}
                      onClick={() => setReportType('results')}
                      className="flex-grow-1"
                    >
                      <FaChartBar className="me-2" />
                      Results
                    </Button>
                  </div>
                </Form.Group>

                {reportType === 'students' && (
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
                )}

                {reportType === 'exams' && (
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
                      <InputGroup className="mb-2">
                        <InputGroup.Text>From</InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroup.Text>To</InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                      </InputGroup>
                    </Form.Group>
                  </>
                )}

                {reportType === 'results' && (
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
                      <InputGroup className="mb-2">
                        <InputGroup.Text>From</InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                      </InputGroup>
                      <InputGroup>
                        <InputGroup.Text>To</InputGroup.Text>
                        <Form.Control
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                      </InputGroup>
                    </Form.Group>
                  </>
                )}

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    onClick={handleGenerateReport}
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
                  
                  {reportData && (
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

        {/* Report Results */}
        <Col md={8}>
          {loading ? (
            <Card className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Generating report...</p>
            </Card>
          ) : reportData ? (
            <>
              {/* Chart */}
              {getChartData() && (
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <div style={{ height: '200px' }}>
                      <Pie 
                        data={getChartData()} 
                        options={{ 
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }} 
                      />
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Summary Stats */}
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="bg-primary text-white">
                    <Card.Body>
                      <h6>Total Records</h6>
                      <h3>{reportData.length}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                
                {reportType === 'students' && (
                  <>
                    <Col md={4}>
                      <Card className="bg-success text-white">
                        <Card.Body>
                          <h6>Active</h6>
                          <h3>{reportData.filter(s => s.isActive).length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-danger text-white">
                        <Card.Body>
                          <h6>Inactive</h6>
                          <h3>{reportData.filter(s => !s.isActive).length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}

                {reportType === 'results' && (
                  <>
                    <Col md={4}>
                      <Card className="bg-success text-white">
                        <Card.Body>
                          <h6>Passed</h6>
                          <h3>{reportData.filter(r => r.isPassed).length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="bg-danger text-white">
                        <Card.Body>
                          <h6>Failed</h6>
                          <h3>{reportData.filter(r => !r.isPassed).length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>

              {/* Data Table */}
              <Card className="shadow-sm">
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped hover size="sm">
                    <thead className="sticky-top bg-white">
                      <tr>
                        {Object.keys(reportData[0] || {}).map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i}>
                              {typeof value === 'boolean' ? (
                                <Badge bg={value ? 'success' : 'secondary'}>
                                  {value ? 'Yes' : 'No'}
                                </Badge>
                              ) : value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
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
    </Container>
  )
}

export default AdminReports