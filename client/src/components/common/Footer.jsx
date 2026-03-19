import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { FaHeart, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <Container fluid>
        <Row className="align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <h5 className="mb-1">Online Exam Platform</h5>
            <p className="small text-secondary mb-0">
              Secure, Reliable, Professional
            </p>
          </Col>
          
          <Col md={4} className="text-center mb-3 mb-md-0">
            <div className="d-flex justify-content-center gap-3">
              <a 
                href="#" 
                className="text-white hover-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub size={20} />
              </a>
              <a 
                href="#" 
                className="text-white hover-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin size={20} />
              </a>
              <a 
                href="#" 
                className="text-white hover-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter size={20} />
              </a>
            </div>
          </Col>
          
          <Col md={4} className="text-center text-md-end">
            <p className="small text-secondary mb-0">
              &copy; {currentYear} All Rights Reserved
            </p>
            <p className="small text-secondary mb-0">
              Made with <FaHeart className="text-danger mx-1" size={12} /> for Education
            </p>
          </Col>
        </Row>
      </Container>

      <style>{`
        .hover-primary:hover {
          color: #0d6efd !important;
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
      `}</style>
    </footer>
  )
}

export default Footer