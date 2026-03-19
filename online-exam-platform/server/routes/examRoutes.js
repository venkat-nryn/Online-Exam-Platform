const express = require('express');
const router = express.Router();
const {
  createExam,
  getAllExams,
  getExam,
  updateExam,
  deleteExam,
  addQuestions,
  uploadQuestions,
  assignExam,
  monitorExam,
  startExam,
  saveAnswer,
  markVisited,
  submitExam,
  reportViolation,
  getStudentExams
} = require('../controllers/examController');
const { protect } = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');
const upload = require('../middlewares/upload');
const { examValidation, examUpdateValidation } = require('../middlewares/validation');

// Public routes (student access)
router.get('/student/my-exams', protect, getStudentExams);
router.post('/:id/start', protect, startExam);
router.post('/:id/save-answer', protect, saveAnswer);
router.post('/:id/mark-visited', protect, markVisited);
router.post('/:id/submit', protect, submitExam);
router.post('/:id/violation', protect, reportViolation);

// Admin only routes
router.use(protect, adminOnly);

// Exam CRUD
router.route('/')
  .post(examValidation, createExam)
  .get(getAllExams);

router.post('/assign', assignExam);
router.get('/:id/monitor', monitorExam);

router.route('/:id')
  .get(getExam)
  .put(examUpdateValidation, updateExam)
  .delete(deleteExam);

// Question management
router.post('/:id/questions', addQuestions);
router.post('/:id/questions/upload', upload.single('file'), uploadQuestions);

module.exports = router;