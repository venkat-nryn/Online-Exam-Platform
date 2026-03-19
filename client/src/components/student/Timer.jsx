import React, { useState, useEffect } from 'react'
import { FaClock } from 'react-icons/fa'
import useTimer from '../../hooks/useTimer'

const Timer = ({ initialSeconds, onTimeUp }) => {
  const {
    seconds,
    formattedTime,
    progress,
    isActive,
    warningShown
  } = useTimer(initialSeconds, onTimeUp)

  const getTimerColor = () => {
    if (seconds <= 60) return 'danger'
    if (seconds <= 300) return 'warning'
    return 'success'
  }

  const getProgressColor = () => {
    if (progress <= 20) return 'bg-danger'
    if (progress <= 50) return 'bg-warning'
    return 'bg-success'
  }

  return (
    <div className="timer-container">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center">
          <FaClock className="me-2" />
          <span className="fw-semibold">Time Remaining</span>
        </div>
        <span className={`badge bg-${getTimerColor()} ${seconds <= 60 ? 'timer-warning' : ''}`}>
          {formattedTime}
        </span>
      </div>
      
      <div className="progress" style={{ height: '8px' }}>
        <div
          className={`progress-bar ${getProgressColor()}`}
          role="progressbar"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      {seconds <= 300 && !warningShown.fiveMin && (
        <div className="alert alert-warning mt-2 mb-0 py-1 small">
          ⚠️ Only 5 minutes remaining!
        </div>
      )}

      {seconds <= 60 && !warningShown.oneMin && (
        <div className="alert alert-danger mt-2 mb-0 py-1 small">
          ⚠️ Only 1 minute remaining!
        </div>
      )}

      <style>{`
        .timer-warning {
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default Timer