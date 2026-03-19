const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  handleValidationErrors
];

// Group validators
const validateGroup = [
  body('groupName')
    .notEmpty().withMessage('Group name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2 and 100 characters'),
  body('year')
    .notEmpty().withMessage('Year is required')
    .matches(/^\d{4}$/).withMessage('Year must be a valid 4-digit year'),
  body('batch')
    .notEmpty().withMessage('Batch is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Batch must be between 2 and 50 characters'),
  body('section')
    .notEmpty().withMessage('Section is required')
    .trim()
    .isLength({ min: 1, max: 10 }).withMessage('Section must be between 1 and 10 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors
];

// Student validators
const validateStudent = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('rollNumber')
    .notEmpty().withMessage('Roll number is required')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Roll number must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\-/]+$/).withMessage('Roll number can only contain letters, numbers, hyphens and slashes'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  body('group')
    .notEmpty().withMessage('Group is required')
    .isMongoId().withMessage('Invalid group ID format'),
  handleValidationErrors
];

// Exam validators
const validateExam = [
  body('examName')
    .notEmpty().withMessage('Exam name is required')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Exam name must be between 3 and 200 characters'),
  body('date')
    .notEmpty().withMessage('Exam date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom(value => {
      const examDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (examDate < today) {
        throw new Error('Exam date cannot be in the past');
      }
      return true;
    }),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  body('passMark')
    .notEmpty().withMessage('Pass mark is required')
    .isInt({ min: 0 }).withMessage('Pass mark must be a positive number'),
  body('totalMarks')
    .notEmpty().withMessage('Total marks is required')
    .isInt({ min: 1 }).withMessage('Total marks must be at least 1')
    .custom((value, { req }) => {
      if (value < req.body.passMark) {
        throw new Error('Total marks must be greater than or equal to pass mark');
      }
      return true;
    }),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Instructions cannot exceed 2000 characters'),
  body('settings.shuffleQuestions')
    .optional()
    .isBoolean().withMessage('Shuffle questions must be a boolean'),
  body('settings.shuffleOptions')
    .optional()
    .isBoolean().withMessage('Shuffle options must be a boolean'),
  body('settings.enableFullScreen')
    .optional()
    .isBoolean().withMessage('Enable full screen must be a boolean'),
  body('settings.enableTabSwitchDetection')
    .optional()
    .isBoolean().withMessage('Enable tab switch detection must be a boolean'),
  body('settings.autoSubmitOnViolation')
    .optional()
    .isBoolean().withMessage('Auto submit on violation must be a boolean'),
  body('settings.maxViolations')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Max violations must be between 1 and 10'),
  handleValidationErrors
];

// Question validators
const validateQuestion = [
  body('question')
    .notEmpty().withMessage('Question text is required')
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Question must be between 5 and 1000 characters'),
  body('options.A')
    .notEmpty().withMessage('Option A is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Option A cannot exceed 500 characters'),
  body('options.B')
    .notEmpty().withMessage('Option B is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Option B cannot exceed 500 characters'),
  body('options.C')
    .notEmpty().withMessage('Option C is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Option C cannot exceed 500 characters'),
  body('options.D')
    .notEmpty().withMessage('Option D is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Option D cannot exceed 500 characters'),
  body('correctAnswer')
    .notEmpty().withMessage('Correct answer is required')
    .isIn(['A', 'B', 'C', 'D']).withMessage('Correct answer must be A, B, C, or D'),
  body('marks')
    .notEmpty().withMessage('Marks are required')
    .isFloat({ min: 0.5, max: 100 }).withMessage('Marks must be between 0.5 and 100'),
  handleValidationErrors
];

// Bulk questions validators (for Excel upload)
const validateBulkQuestions = [
  body().isArray().withMessage('Questions must be an array'),
  body('*.question')
    .notEmpty().withMessage('Question text is required in all rows'),
  body('*.options.A')
    .notEmpty().withMessage('Option A is required in all rows'),
  body('*.options.B')
    .notEmpty().withMessage('Option B is required in all rows'),
  body('*.options.C')
    .notEmpty().withMessage('Option C is required in all rows'),
  body('*.options.D')
    .notEmpty().withMessage('Option D is required in all rows'),
  body('*.correctAnswer')
    .notEmpty().withMessage('Correct answer is required in all rows')
    .isIn(['A', 'B', 'C', 'D']).withMessage('Correct answer must be A, B, C, or D'),
  body('*.marks')
    .notEmpty().withMessage('Marks are required in all rows')
    .isFloat({ min: 0.5 }).withMessage('Marks must be positive numbers'),
  handleValidationErrors
];

// Exam assignment validators
const validateExamAssignment = [
  body('examId')
    .notEmpty().withMessage('Exam ID is required')
    .isMongoId().withMessage('Invalid exam ID format'),
  body('studentIds')
    .optional()
    .isArray().withMessage('Student IDs must be an array'),
  body('studentIds.*')
    .optional()
    .isMongoId().withMessage('Invalid student ID format'),
  body('groupIds')
    .optional()
    .isArray().withMessage('Group IDs must be an array'),
  body('groupIds.*')
    .optional()
    .isMongoId().withMessage('Invalid group ID format'),
  body().custom((value) => {
    if ((!value.studentIds || value.studentIds.length === 0) && 
        (!value.groupIds || value.groupIds.length === 0)) {
      throw new Error('At least one student or group must be selected');
    }
    return true;
  }),
  handleValidationErrors
];

// Result update validators
const validateResultUpdate = [
  body('obtainedMarks')
    .notEmpty().withMessage('Obtained marks are required')
    .isFloat({ min: 0 }).withMessage('Obtained marks must be a positive number'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters'),
  handleValidationErrors
];

// ID parameter validator
const validateIdParam = [
  param('id')
    .notEmpty().withMessage('ID parameter is required')
    .isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// Pagination validators
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString().withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

// Date range validator
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

// File upload validator
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only Excel and CSV files are allowed.'
    });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.'
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateChangePassword,
  validateGroup,
  validateStudent,
  validateExam,
  validateQuestion,
  validateBulkQuestions,
  validateExamAssignment,
  validateResultUpdate,
  validateIdParam,
  validatePagination,
  validateDateRange,
  validateFileUpload,
  handleValidationErrors
};