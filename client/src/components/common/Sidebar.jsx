import React from 'react'
import { Nav } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaUsers,
  FaUserGraduate,
  FaFileAlt,
  FaChartBar,
  FaSignOutAlt,
  FaClipboardList,
  FaBook,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import { logout } from '../../store/slices/authSlice'
import { toggleSidebar } from '../../store/slices/uiSlice'
import toast from 'react-hot-toast'

const Sidebar = ({ userType }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const adminMenuItems = [
    { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/admin/groups', icon: <FaUsers />, label: 'Groups' },
    { path: '/admin/students', icon: <FaUserGraduate />, label: 'Students' },
    { path: '/admin/exams', icon: <FaFileAlt />, label: 'Exams' },
    { path: '/admin/results', icon: <FaCheckCircle />, label: 'Results' },
    { path: '/admin/reports', icon: <FaChartBar />, label: 'Reports' }
  ]

  const studentMenuItems = [
    { path: '/student', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/student/exams', icon: <FaBook />, label: 'My Exams' },
    { path: '/student/results', icon: <FaCheckCircle />, label: 'My Results' }
  ]

  const menuItems = userType === 'admin' ? adminMenuItems : studentMenuItems

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div 
      className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${darkMode ? 'bg-dark' : 'bg-primary'}`}
      style={{
        width: sidebarOpen ? '250px' : '70px',
        minHeight: '100vh',
        transition: 'all 0.3s',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      <div className="d-flex flex-column h-100">
        {/* Logo Area */}
        <div className="p-3 d-flex align-items-center justify-content-between border-bottom border-light">
          {sidebarOpen && (
            <h5 className="m-0 fw-bold">
              <i className="fas fa-graduation-cap me-2"></i>
              ExamPortal
            </h5>
          )}
          <button 
            className="btn btn-link text-white p-0"
            onClick={() => dispatch(toggleSidebar())}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        {/* Menu Items */}
        <Nav className="flex-column p-2 flex-grow-1">
          {menuItems.map((item, index) => (
            <Nav.Link
              key={index}
              onClick={() => navigate(item.path)}
              className={`text-white d-flex align-items-center p-3 mb-1 rounded
                ${isActive(item.path) ? 'bg-white text-primary' : 'hover-bg-light'}`}
              style={{ cursor: 'pointer' }}
            >
              <span className="me-3" style={{ fontSize: '1.2rem' }}>
                {item.icon}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </Nav.Link>
          ))}
        </Nav>

        {/* Logout Button */}
        <div className="p-2 border-top border-light">
          <Nav.Link
            onClick={handleLogout}
            className="text-white d-flex align-items-center p-3 rounded hover-bg-light"
            style={{ cursor: 'pointer' }}
          >
            <span className="me-3" style={{ fontSize: '1.2rem' }}>
              <FaSignOutAlt />
            </span>
            {sidebarOpen && <span>Logout</span>}
          </Nav.Link>
        </div>
      </div>

      <style>{`
        .hover-bg-light:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .bg-white.text-primary {
          color: #0d6efd !important;
        }
        .sidebar {
          box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}

export default Sidebar