const express = require('express');
const router = express.Router();
const {
  getAllResults,
  getResultsByExam,
  getStudentExamResult,
  getStudentResults,
  updateResultMarks,
  publishResults,
  unpublishResults,
  getResultAnalytics,
  downloadResultReport
} = require('../controllers/resultController');
const { protect } = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');

// Student accessible routes
router.get('/student/:studentId', protect, getStudentResults);
router.get('/student/:studentId/exam/:examId', protect, getStudentExamResult);

// Admin only routes
router.use(protect, adminOnly);

router.get('/', getAllResults);
router.get('/exam/:examId', getResultsByExam);
router.get('/analytics/:examId', getResultAnalytics);
router.get('/download/:examId', downloadResultReport);
router.put('/publish/:examId', publishResults);
router.put('/unpublish/:examId', unpublishResults);
router.put('/:resultId', updateResultMarks);

module.exports = router;