import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Spinner } from 'react-bootstrap'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userType, authChecked } = useSelector((state) => state.auth)

  // Don't make a redirect decision until auth state is confirmed
  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default PrivateRoute