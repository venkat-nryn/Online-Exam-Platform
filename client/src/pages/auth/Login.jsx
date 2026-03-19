import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap'
import { FaUser, FaLock, FaGraduationCap, FaUserTie } from 'react-icons/fa'
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice'
import { setLoading } from '../../store/slices/uiSlice'
import authService from '../../services/authService'
import toast from 'react-hot-toast'

const logoModules = import.meta.glob('./*.{png,jpg,jpeg,svg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default'
})

const preferredLogoNames = ['smveclogo', 'college-logo', 'clg-logo', 'logo']
const logoEntries = Object.entries(logoModules)

const collegeLogo = (() => {
  if (logoEntries.length === 0) {
    return null
  }

  const preferredEntry = logoEntries.find(([filePath]) =>
    preferredLogoNames.some((name) => filePath.toLowerCase().includes(name))
  )

  return preferredEntry ? preferredEntry[1] : logoEntries[0][1]
})()

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, userType, loading } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  })

  const [validated, setValidated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${userType}`)
    }
  }, [isAuthenticated, userType, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    
    if (form.checkValidity() === false) {
      e.stopPropagation()
      setValidated(true)
      return
    }

    setValidated(true)
    dispatch(loginStart())
    dispatch(setLoading(true))

    try {
      const response = await authService.login(formData)
      dispatch(loginSuccess(response))
      toast.success(`Welcome back, ${response.user.name}!`)
      navigate(`/${response.userType}`)
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.message || 'Login failed'))
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            <Card.Header className="bg-primary text-white text-center py-4 border-0">
              {collegeLogo ? (
                <div
                  className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.22)'
                  }}
                >
                  <img
                    src={collegeLogo}
                    alt="College Logo"
                    style={{ width: 'clamp(240px, 80%, 460px)', height: 'auto', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <FaGraduationCap size={50} className="mb-3" />
              )}
              <h2 className="fw-bold mb-0">Online Exam Platform</h2>
              <p className="mb-0 opacity-75">Secure Examination System</p>
            </Card.Header>
            
            <Card.Body className="p-4 p-lg-5">
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                  <div className="btn-group" role="group">
                    <Button
                      variant={formData.role === 'student' ? 'primary' : 'outline-primary'}
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaUser /> Student
                    </Button>
                    <Button
                      variant={formData.role === 'admin' ? 'primary' : 'outline-primary'}
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaUserTie /> Admin
                    </Button>
                  </div>
                </div>

                <Form.Group className="mb-4" controlId="email">
                  <Form.Label className="fw-semibold">Email Address</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <FaUser className="text-primary" />
                    </span>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="border-start-0 ps-0"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid email address.
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <FaLock className="text-primary" />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="border-start-0 ps-0"
                      required
                      minLength={6}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      className="border-start-0"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      Password must be at least 6 characters.
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check type="checkbox" label="Remember me" />
                  <a href="#" className="text-primary text-decoration-none">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-3 fw-bold rounded-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Logging in...
                    </>
                  ) : (
                    'Login to Dashboard'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Default Credentials:<br />
                  Admin: admin@example.com / Admin@123<br />
                  Student: student@example.com / Student@123
                </small>
              </div>
            </Card.Body>
            
            <Card.Footer className="bg-white border-0 text-center py-3">
              <small className="text-muted">
                &copy; 2024 Online Exam Platform. All rights reserved.
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login