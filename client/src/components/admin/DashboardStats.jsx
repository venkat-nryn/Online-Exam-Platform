import React from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { 
  FaUsers, FaUserGraduate, FaFileAlt, FaCheckCircle, 
  FaChartLine, FaCalendarCheck, FaClock, FaExclamationTriangle,
  FaArrowUp, FaArrowDown 
} from 'react-icons/fa'

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Students',
      value: stats?.overview?.totalStudents || 0,
      icon: <FaUsers />,
      color: 'primary',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Students',
      value: stats?.overview?.activeStudents || 0,
      icon: <FaUserGraduate />,
      color: 'success',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Total Groups',
      value: stats?.overview?.totalGroups || 0,
      icon: <FaUsers />,
      color: 'info',
      change: '0%',
      trend: 'neutral'
    },
    {
      title: 'Total Exams',
      value: stats?.overview?.totalExams || 0,
      icon: <FaFileAlt />,
      color: 'warning',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Published Exams',
      value: stats?.overview?.publishedExams || 0,
      icon: <FaCheckCircle />,
      color: 'success',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Completed Exams',
      value: stats?.overview?.completedExams || 0,
      icon: <FaClock />,
      color: 'secondary',
      change: '+10%',
      trend: 'up'
    },
    {
      title: "Today's Exams",
      value: stats?.overview?.todayExams || 0,
      icon: <FaCalendarCheck />,
      color: 'danger',
      change: stats?.overview?.todayExams > 0 ? 'Now' : 'None',
      trend: stats?.overview?.todayExams > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Pass Rate',
      value: stats?.overall?.passPercentage?.toFixed(1) || '0%',
      icon: <FaChartLine />,
      color: 'primary',
      change: '+2.5%',
      trend: 'up'
    }
  ]

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <FaArrowUp className="text-success" />
    if (trend === 'down') return <FaArrowDown className="text-danger" />
    return null
  }

  return (
    <Row className="g-4 mb-4">
      {statCards.map((card, index) => (
        <Col key={index} md={3}>
          <Card className={`shadow-sm border-0 border-start border-${card.color} border-4 h-100`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="text-muted mb-2">{card.title}</h6>
                  <h3 className="mb-0">{card.value}</h3>
                  {card.change && (
                    <small className="text-muted">
                      {getTrendIcon(card.trend)}
                      <span className="ms-1">{card.change}</span>
                    </small>
                  )}
                </div>
                <div className={`bg-${card.color} bg-opacity-10 p-3 rounded`}>
                  <div className={`text-${card.color}`} style={{ fontSize: '1.5rem' }}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default DashboardStats