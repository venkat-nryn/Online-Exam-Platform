// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation (min 6 chars, at least one letter and one number)
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/
  return passwordRegex.test(password)
}

// Name validation
export const isValidName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/
  return nameRegex.test(name)
}

// Roll number validation
export const isValidRollNumber = (rollNumber) => {
  const rollRegex = /^[a-zA-Z0-9\-/]{3,20}$/
  return rollRegex.test(rollNumber)
}

// Phone number validation (10 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{10}$/
  return phoneRegex.test(phone)
}

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Date validation (not in past)
export const isValidFutureDate = (date) => {
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate >= today
}

// Time validation (HH:MM format)
export const isValidTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

// Marks validation
export const isValidMarks = (marks, maxMarks) => {
  const numMarks = Number(marks)
  return !isNaN(numMarks) && numMarks >= 0 && numMarks <= maxMarks
}

// Question validation
export const isValidQuestion = (question) => {
  return question && question.length >= 5 && question.length <= 1000
}

// Option validation
export const isValidOption = (option) => {
  return option && option.length >= 1 && option.length <= 500
}

// Group name validation
export const isValidGroupName = (name) => {
  return name && name.length >= 2 && name.length <= 100
}

// Batch validation
export const isValidBatch = (batch) => {
  return batch && batch.length >= 2 && batch.length <= 50
}

// Section validation
export const isValidSection = (section) => {
  return section && section.length >= 1 && section.length <= 10
}

// Year validation (4 digits)
export const isValidYear = (year) => {
  const yearRegex = /^\d{4}$/
  return yearRegex.test(year)
}

// File type validation
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type)
}

// File size validation (in MB)
export const isValidFileSize = (file, maxSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

// Excel file validation
export const isValidExcelFile = (file) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
  return isValidFileType(file, allowedTypes) && isValidFileSize(file, 5) // 5MB max
}

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    
    if (rule.required && !value) {
      errors[field] = `${field} is required`
    } else if (value) {
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${field} must not exceed ${rule.maxLength} characters`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} is invalid`
      }
      if (rule.custom && !rule.custom(value)) {
        errors[field] = rule.message || `${field} is invalid`
      }
    }
  }
  
  return errors
}

// Login form validation
export const validateLogin = (data) => {
  const errors = {}
  
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!data.password) {
    errors.password = 'Password is required'
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  if (!data.role) {
    errors.role = 'Please select a role'
  }
  
  return errors
}

// Student creation validation
export const validateStudent = (data) => {
  const errors = {}
  
  if (!data.name) {
    errors.name = 'Name is required'
  } else if (!isValidName(data.name)) {
    errors.name = 'Name must contain only letters and spaces (2-50 characters)'
  }
  
  if (!data.rollNumber) {
    errors.rollNumber = 'Roll number is required'
  } else if (!isValidRollNumber(data.rollNumber)) {
    errors.rollNumber = 'Invalid roll number format'
  }
  
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format'
  }
  
  if (!data.password) {
    errors.password = 'Password is required'
  } else if (!isValidPassword(data.password)) {
    errors.password = 'Password must be at least 6 characters with at least one letter and one number'
  }
  
  if (!data.group) {
    errors.group = 'Group is required'
  }
  
  return errors
}

// Exam creation validation
export const validateExam = (data) => {
  const errors = {}
  
  if (!data.examName) {
    errors.examName = 'Exam name is required'
  } else if (data.examName.length < 3 || data.examName.length > 200) {
    errors.examName = 'Exam name must be between 3 and 200 characters'
  }
  
  if (!data.date) {
    errors.date = 'Exam date is required'
  } else if (!isValidFutureDate(data.date)) {
    errors.date = 'Exam date cannot be in the past'
  }
  
  if (!data.startTime) {
    errors.startTime = 'Start time is required'
  } else if (!isValidTime(data.startTime)) {
    errors.startTime = 'Invalid time format (use HH:MM)'
  }
  
  if (!data.duration) {
    errors.duration = 'Duration is required'
  } else if (data.duration < 1 || data.duration > 480) {
    errors.duration = 'Duration must be between 1 and 480 minutes'
  }
  
  if (!data.passMark) {
    errors.passMark = 'Pass mark is required'
  } else if (data.passMark < 0) {
    errors.passMark = 'Pass mark must be positive'
  }
  
  if (!data.totalMarks) {
    errors.totalMarks = 'Total marks is required'
  } else if (data.totalMarks < 1) {
    errors.totalMarks = 'Total marks must be at least 1'
  } else if (data.passMark && data.totalMarks < data.passMark) {
    errors.totalMarks = 'Total marks must be greater than or equal to pass mark'
  }
  
  return errors
}

// Question validation
export const validateQuestion = (data) => {
  const errors = {}
  
  if (!data.question) {
    errors.question = 'Question is required'
  } else if (!isValidQuestion(data.question)) {
    errors.question = 'Question must be between 5 and 1000 characters'
  }
  
  if (!data.options?.A) {
    errors['options.A'] = 'Option A is required'
  } else if (!isValidOption(data.options.A)) {
    errors['options.A'] = 'Option A must be between 1 and 500 characters'
  }
  
  if (!data.options?.B) {
    errors['options.B'] = 'Option B is required'
  } else if (!isValidOption(data.options.B)) {
    errors['options.B'] = 'Option B must be between 1 and 500 characters'
  }
  
  if (!data.options?.C) {
    errors['options.C'] = 'Option C is required'
  } else if (!isValidOption(data.options.C)) {
    errors['options.C'] = 'Option C must be between 1 and 500 characters'
  }
  
  if (!data.options?.D) {
    errors['options.D'] = 'Option D is required'
  } else if (!isValidOption(data.options.D)) {
    errors['options.D'] = 'Option D must be between 1 and 500 characters'
  }
  
  if (!data.correctAnswer) {
    errors.correctAnswer = 'Correct answer is required'
  } else if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) {
    errors.correctAnswer = 'Correct answer must be A, B, C, or D'
  }
  
  if (!data.marks) {
    errors.marks = 'Marks are required'
  } else if (data.marks < 0.5 || data.marks > 100) {
    errors.marks = 'Marks must be between 0.5 and 100'
  }
  
  return errors
}

// Group validation
export const validateGroup = (data) => {
  const errors = {}
  
  if (!data.groupName) {
    errors.groupName = 'Group name is required'
  } else if (!isValidGroupName(data.groupName)) {
    errors.groupName = 'Group name must be between 2 and 100 characters'
  }
  
  if (!data.year) {
    errors.year = 'Year is required'
  } else if (!isValidYear(data.year)) {
    errors.year = 'Year must be a valid 4-digit year'
  }
  
  if (!data.batch) {
    errors.batch = 'Batch is required'
  } else if (!isValidBatch(data.batch)) {
    errors.batch = 'Batch must be between 2 and 50 characters'
  }
  
  if (!data.section) {
    errors.section = 'Section is required'
  } else if (!isValidSection(data.section)) {
    errors.section = 'Section must be between 1 and 10 characters'
  }
  
  return errors
}