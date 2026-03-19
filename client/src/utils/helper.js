import { format, parseISO } from 'date-fns'

export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return 'N/A'
  try {
    return format(parseISO(date), formatStr)
  } catch {
    return format(new Date(date), formatStr)
  }
}

export const formatTime = (time) => {
  if (!time) return 'N/A'
  return time
}

export const formatDateTime = (date, time) => {
  return `${formatDate(date)} at ${formatTime(time)}`
}

export const calculateTimeRemaining = (endTime) => {
  const now = new Date()
  const end = new Date(endTime)
  const diff = end - now
  
  if (diff <= 0) return 0
  
  return Math.floor(diff / 1000) // return seconds
}

export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return '00:00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const getExamStatus = (examDate, startTime, duration) => {
  const now = new Date()
  const examStart = new Date(examDate)
  const [hours, minutes] = startTime.split(':')
  examStart.setHours(parseInt(hours), parseInt(minutes), 0)
  
  const examEnd = new Date(examStart.getTime() + duration * 60000)
  
  if (now < examStart) return 'upcoming'
  if (now >= examStart && now <= examEnd) return 'live'
  return 'completed'
}

export const calculatePercentage = (obtained, total) => {
  if (!total || total === 0) return 0
  return ((obtained / total) * 100).toFixed(2)
}

export const getGradeFromPercentage = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

export const downloadFile = (data, filename, type) => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

export const sortByDate = (array, dateField = 'createdAt', ascending = false) => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField])
    const dateB = new Date(b[dateField])
    return ascending ? dateA - dateB : dateB - dateA
  })
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export const generateInitials = (name) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}