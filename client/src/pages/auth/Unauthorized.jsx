import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row>
        <Col md={12} className="text-center">
          <Card className="shadow-lg border-0 rounded-4 p-5">
            <div className="mb-4">
              <FaExclamationTriangle size={80} className="text-warning" />
            </div>
            <h1 className="display-4 fw-bold text-danger mb-3">403</h1>
            <h2 className="h3 mb-3">Access Denied</h2>
            <p className="text-muted mb-4">
              You don't have permission to access this page.<br />
              Please contact your administrator if you believe this is a mistake.
            </p>
            <div>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate(-1)}
                className="rounded-pill px-4"
              >
                <FaArrowLeft className="me-2" />
                Go Back
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Unauthorized