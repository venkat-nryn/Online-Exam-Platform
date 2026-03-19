const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const groupValidation = [
  body('groupName').notEmpty().withMessage('Group name is required'),
  body('year').notEmpty().withMessage('Year is required'),
  body('batch').notEmpty().withMessage('Batch is required'),
  body('section').notEmpty().withMessage('Section is required'),
  validateRequest
];

const studentValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('rollNumber').notEmpty().withMessage('Roll number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('group').notEmpty().withMessage('Group is required'),
  validateRequest
];

const examValidation = [
  body('examName').notEmpty().withMessage('Exam name is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('passMark').isNumeric().withMessage('Pass mark must be a number'),
  body('totalMarks').isNumeric().withMessage('Total marks must be a number'),
  validateRequest
];

const examUpdateValidation = [
  body('examName').optional().notEmpty().withMessage('Exam name cannot be empty'),
  body('date').optional().notEmpty().withMessage('Date cannot be empty'),
  body('startTime').optional().notEmpty().withMessage('Start time cannot be empty'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('passMark').optional().isNumeric().withMessage('Pass mark must be a number'),
  body('totalMarks').optional().isNumeric().withMessage('Total marks must be a number'),
  body('status').optional().isIn(['draft', 'published', 'in-progress', 'completed']).withMessage('Invalid status'),
  validateRequest
];

module.exports = {
  groupValidation,
  studentValidation,
  examValidation,
  examUpdateValidation
};