import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { FaExclamationTriangle } from 'react-icons/fa'

const WarningModal = ({ show, onClose, message, type = 'warning' }) => {
  const getVariant = () => {
    switch(type) {
      case 'danger': return 'danger'
      case 'success': return 'success'
      default: return 'warning'
    }
  }

  const getIcon = () => {
    switch(type) {
      case 'danger': return <FaExclamationTriangle className="text-danger" size={40} />
      case 'success': return <i className="fas fa-check-circle text-success" style={{ fontSize: '40px' }}></i>
      default: return <FaExclamationTriangle className="text-warning" size={40} />
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton className={`border-${getVariant()}`}>
        <Modal.Title className="d-flex align-items-center">
          {getIcon()}
          <span className="ms-2">
            {type === 'danger' ? 'Warning!' : type === 'success' ? 'Success!' : 'Notice'}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <p className="lead mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant={getVariant()} onClick={onClose}>
          {type === 'danger' ? 'I Understand' : 'OK'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default WarningModal