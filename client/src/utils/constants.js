export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student'
}

export const EXAM_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed'
}

export const EXAM_ATTEMPT_STATUS = {
  PENDING: 'pending',
  STARTED: 'started',
  COMPLETED: 'completed',
  AUTO_SUBMITTED: 'auto-submitted'
}

export const VIOLATION_TYPES = {
  FULLSCREEN_EXIT: 'fullscreen_exit',
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur'
}

export const MAX_VIOLATIONS = 3
export const AUTO_SAVE_INTERVAL = 10000 // 10 seconds

export const WARNING_TIMES = {
  FIVE_MINUTES: 300,
  ONE_MINUTE: 60,
  THIRTY_SECONDS: 30
}

export const REPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel'
}

export const CHART_COLORS = {
  primary: '#0d6efd',
  success: '#198754',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#0dcaf0',
  secondary: '#6c757d'
}

export const GRADE_COLORS = {
  'A+': '#198754',
  'A': '#20c997',
  'B': '#0dcaf0',
  'C': '#ffc107',
  'D': '#fd7e14',
  'F': '#dc3545'
}