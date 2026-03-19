import { useState, useEffect, useCallback, useRef } from 'react'
import { formatTimeRemaining } from '../utils/helpers'

const useTimer = (initialSeconds, onComplete) => {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(true)
  const [warningShown, setWarningShown] = useState({
    fiveMin: false,
    oneMin: false,
    thirtySec: false
  })
  
  const timerRef = useRef(null)

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const pause = useCallback(() => {
    setIsActive(false)
  }, [])

  const reset = useCallback((newSeconds) => {
    setSeconds(newSeconds)
    setIsActive(true)
    setWarningShown({
      fiveMin: false,
      oneMin: false,
      thirtySec: false
    })
  }, [])

  const addTime = useCallback((additionalSeconds) => {
    setSeconds(prev => prev + additionalSeconds)
  }, [])

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev - 1)
      }, 1000)
    } else if (seconds === 0 && isActive) {
      setIsActive(false)
      onComplete?.()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, seconds, onComplete])

  // Warning triggers
  useEffect(() => {
    if (!warningShown.fiveMin && seconds === 300) {
      setWarningShown(prev => ({ ...prev, fiveMin: true }))
      // Play warning sound or show warning
      const audio = new Audio('/sounds/warning.mp3')
      audio.play().catch(() => {})
    }
    
    if (!warningShown.oneMin && seconds === 60) {
      setWarningShown(prev => ({ ...prev, oneMin: true }))
    }
    
    if (!warningShown.thirtySec && seconds === 30) {
      setWarningShown(prev => ({ ...prev, thirtySec: true }))
    }
  }, [seconds, warningShown])

  const formattedTime = formatTimeRemaining(seconds)
  const progress = (seconds / initialSeconds) * 100

  return {
    seconds,
    formattedTime,
    progress,
    isActive,
    start,
    pause,
    reset,
    addTime,
    warningShown
  }
}

export default useTimer