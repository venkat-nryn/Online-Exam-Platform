import React from 'react'
import { Spinner } from 'react-bootstrap'

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="text-center">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Loading...</p>
      </div>

      <style>{`
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
      `}</style>
    </div>
  )
}

export default Loader