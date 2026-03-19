const express = require('express');
const router = express.Router();
const {
  generateStudentReport,
  generateExamReport,
  generateResultReport,
  getDashboardStats,
  exportAllData
} = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');

// All routes are protected and admin only
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/export-all', exportAllData);
router.post('/students', generateStudentReport);
router.post('/exams', generateExamReport);
router.post('/results', generateResultReport);

module.exports = router;