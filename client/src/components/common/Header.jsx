import React from 'react'
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaUserCircle, FaSignOutAlt, FaBell, FaMoon, FaSun, FaBars } from 'react-icons/fa'
import { logout } from '../../store/slices/authSlice'
import { toggleSidebar, toggleDarkMode } from '../../store/slices/uiSlice'
import toast from 'react-hot-toast'

const Header = ({ user, userType }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { darkMode } = useSelector((state) => state.ui)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar())
  }

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode())
    toast.success(`${darkMode ? 'Light' : 'Dark'} mode activated`)
  }

  const getDashboardLink = () => {
    return userType === 'admin' ? '/admin' : '/student'
  }

  return (
    <Navbar bg={darkMode ? 'dark' : 'primary'} variant="dark" expand="lg" className="px-3 shadow-sm sticky-top">
      <Container fluid>
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-link text-white me-3 p-0" 
            onClick={handleToggleSidebar}
            style={{ fontSize: '1.5rem' }}
          >
            <FaBars />
          </button>
          <Navbar.Brand 
            href={getDashboardLink()} 
            className="fw-bold d-flex align-items-center"
            onClick={(e) => { e.preventDefault(); navigate(getDashboardLink()); }}
          >
            <i className="fas fa-graduation-cap me-2"></i>
            Exam Platform
          </Navbar.Brand>
        </div>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Dark Mode Toggle */}
            <button 
              className="btn btn-link text-white me-3" 
              onClick={handleToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>

            {/* Notifications */}
            <Nav.Link href="#" className="text-white position-relative me-3">
              <FaBell size={20} />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
                <span className="visually-hidden">unread notifications</span>
              </span>
            </Nav.Link>

            {/* User Menu */}
            <NavDropdown 
              title={
                <div className="d-inline-flex align-items-center text-white">
                  <FaUserCircle size={24} className="me-2" />
                  <span className="d-none d-md-inline">
                    {user?.name || 'User'}
                  </span>
                </div>
              }
              id="basic-nav-dropdown"
              className="text-white"
              menuVariant={darkMode ? 'dark' : 'light'}
            >
              <NavDropdown.Item 
                onClick={() => navigate(getDashboardLink())}
                className="d-flex align-items-center"
              >
                <i className="fas fa-tachometer-alt me-2"></i>
                Dashboard
              </NavDropdown.Item>
              
              <NavDropdown.Item 
                onClick={() => navigate(`/${userType}/profile`)}
                className="d-flex align-items-center"
              >
                <i className="fas fa-user me-2"></i>
                Profile
              </NavDropdown.Item>
              
              <NavDropdown.Item 
                onClick={() => navigate(`/${userType}/settings`)}
                className="d-flex align-items-center"
              >
                <i className="fas fa-cog me-2"></i>
                Settings
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item 
                onClick={handleLogout}
                className="d-flex align-items-center text-danger"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>

            {/* User Type Badge */}
            <span className={`badge ms-2 ${userType === 'admin' ? 'bg-warning' : 'bg-info'} text-dark`}>
              {userType === 'admin' ? 'Administrator' : 'Student'}
            </span>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default Header