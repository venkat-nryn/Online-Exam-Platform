import toast from 'react-hot-toast'

class AntiCheatSystem {
  constructor(examId, onViolation, maxViolations = 3) {
    this.examId = examId
    this.onViolation = onViolation
    this.maxViolations = maxViolations
    this.violationCount = 0
    this.fullScreenEnabled = false
    this.warningShown = false
    this.autoSubmitTimer = null
  }

  // Initialize anti-cheat measures
  init() {
    this.enableFullScreenDetection()
    this.enableTabSwitchDetection()
    this.enableWindowBlurDetection()
    this.enableCopyPastePrevention()
  }

  // Clean up event listeners
  cleanup() {
    document.removeEventListener('fullscreenchange', this.handleFullScreenChange)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('blur', this.handleWindowBlur)
    document.removeEventListener('copy', this.handleCopy)
    document.removeEventListener('paste', this.handlePaste)
    
    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer)
    }
  }

  // Full screen detection
  enableFullScreenDetection() {
    this.handleFullScreenChange = this.handleFullScreenChange.bind(this)
    document.addEventListener('fullscreenchange', this.handleFullScreenChange)
    
    // Request full screen
    this.requestFullScreen()
  }

  requestFullScreen() {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
        .then(() => {
          this.fullScreenEnabled = true
        })
        .catch(err => {
          console.error('Full screen request failed:', err)
        })
    }
  }

  handleFullScreenChange() {
    if (!document.fullscreenElement && this.fullScreenEnabled) {
      this.handleViolation('fullscreen_exit', 'Exited full screen mode')
    }
  }

  // Tab switch detection
  enableTabSwitchDetection() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.handleViolation('tab_switch', 'Switched to another tab')
    }
  }

  // Window blur detection
  enableWindowBlurDetection() {
    this.handleWindowBlur = this.handleWindowBlur.bind(this)
    window.addEventListener('blur', this.handleWindowBlur)
  }

  handleWindowBlur() {
    this.handleViolation('window_blur', 'Navigated away from exam window')
  }

  // Copy-paste prevention
  enableCopyPastePrevention() {
    this.handleCopy = (e) => {
      e.preventDefault()
      toast.error('Copying is not allowed during exam')
    }
    
    this.handlePaste = (e) => {
      e.preventDefault()
      toast.error('Pasting is not allowed during exam')
    }
    
    document.addEventListener('copy', this.handleCopy)
    document.addEventListener('paste', this.handlePaste)
  }

  // Handle violations
  async handleViolation(type, details) {
    this.violationCount++
    
    // Show warning
    this.showWarningMessage()
    
    // Report to server
    try {
      await this.onViolation(type, details)
    } catch (error) {
      console.error('Failed to report violation:', error)
    }

    // Check if max violations reached
    if (this.violationCount >= this.maxViolations) {
      this.initiateAutoSubmit()
    }
  }

  // Show warning message
  showWarningMessage() {
    const remaining = this.maxViolations - this.violationCount
    
    if (remaining > 0) {
      toast.error(
        `Warning: You are leaving the exam screen. 
        ${remaining} ${remaining === 1 ? 'warning' : 'warnings'} remaining. 
        If this happens ${remaining} more time${remaining === 1 ? '' : 's'}, 
        the exam will auto-submit.`,
        {
          duration: 5000,
          icon: '⚠️'
        }
      )
    }
  }

  // Initiate auto-submit
  initiateAutoSubmit() {
    if (this.autoSubmitTimer) return

    toast.error(
      'Maximum violations reached! Exam will auto-submit in 45 seconds.',
      {
        duration: 45000,
        icon: '⏰'
      }
    )

    this.autoSubmitTimer = setTimeout(() => {
      this.autoSubmitExam()
    }, 45000)
  }

  // Auto submit exam
  autoSubmitExam() {
    // Trigger exam submission
    if (window.confirm('Exam is being auto-submitted due to multiple violations.')) {
      // Call exam submission function
      window.submitExam && window.submitExam('auto')
    }
  }

  // Reset violations (called when starting new exam)
  reset() {
    this.violationCount = 0
    this.warningShown = false
    if (this.autoSubmitTimer) {
      clearTimeout(this.autoSubmitTimer)
      this.autoSubmitTimer = null
    }
  }
}

export default AntiCheatSystem