import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap'
import { 
  FaUsers, FaUserGraduate, FaFileAlt, FaCheckCircle, 
  FaChartLine, FaCalendarCheck, FaClock, FaExclamationTriangle 
} from 'react-icons/fa'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import reportService from '../../services/reportService'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement
)

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await reportService.getDashboardStats()
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    )
  }

  const activityChartData = {
    labels: stats?.activity?.map(a => a.date) || [],
    datasets: [
      {
        label: 'Exam Submissions',
        data: stats?.activity?.map(a => a.submissions) || [],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const examPerformanceData = {
    labels: stats?.topExams?.map(e => e.examName.substring(0, 20) + '...') || [],
    datasets: [
      {
        label: 'Total Students',
        data: stats?.topExams?.map(e => e.totalStudents) || [],
        backgroundColor: '#0d6efd',
        borderRadius: 5
      },
      {
        label: 'Passed Students',
        data: stats?.topExams?.map(e => e.passedStudents) || [],
        backgroundColor: '#198754',
        borderRadius: 5
      }
    ]
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Admin Dashboard</h2>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-primary text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50">Total Students</h6>
                  <h2 className="mb-0">{stats?.overview?.totalStudents || 0}</h2>
                  <small className="text-white-50">
                    {stats?.overview?.activeStudents} Active
                  </small>
                </div>
                <FaUsers size={40} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 bg-success text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50">Total Groups</h6>
                  <h2 className="mb-0">{stats?.overview?.totalGroups || 0}</h2>
                </div>
                <FaUserGraduate size={40} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 bg-info text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50">Total Exams</h6>
                  <h2 className="mb-0">{stats?.overview?.totalExams || 0}</h2>
                  <small className="text-white-50">
                    {stats?.overview?.publishedExams} Published
                  </small>
                </div>
                <FaFileAlt size={40} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 bg-warning text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-white-50">Today's Exams</h6>
                  <h2 className="mb-0">{stats?.overview?.todayExams || 0}</h2>
                </div>
                <FaCalendarCheck size={40} className="opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Activity (Last 7 Days)</h5>
            </Card.Header>
            <Card.Body>
              <Line 
                data={activityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
                height={200}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Completion Rate</span>
                  <strong>
                    {stats?.overview?.completedExams 
                      ? ((stats.overview.completedExams / stats.overview.totalExams) * 100).toFixed(1)
                      : 0}%
                  </strong>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: stats?.overview?.completedExams 
                        ? `${(stats.overview.completedExams / stats.overview.totalExams) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Active Students</span>
                  <strong>
                    {stats?.overview?.activeStudentsPercentage?.toFixed(1) || 0}%
                  </strong>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar bg-info" 
                    style={{ width: `${stats?.overview?.activeStudentsPercentage || 0}%` }}
                  />
                </div>
              </div>

              <hr />

              <div className="text-center">
                <h6 className="mb-3">Recent Activity</h6>
                {stats?.recentResults?.slice(0, 3).map((result, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <FaCheckCircle className="text-success me-2" size={12} />
                    <small className="text-truncate">
                      {result.student?.name} completed {result.exam?.examName}
                    </small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Exam Performance */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Top Exams Performance</h5>
            </Card.Header>
            <Card.Body>
              <Bar 
                data={examPerformanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard