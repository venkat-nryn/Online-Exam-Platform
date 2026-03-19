const express = require('express');
const router = express.Router();
const {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentsByGroup,
  searchStudents,
  toggleStudentStatus
} = require('../controllers/studentController');
const { protect } = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');
const upload = require('../middlewares/upload');
const { studentValidation } = require('../middlewares/validation');

// All routes are protected and admin only
router.use(protect, adminOnly);

// Student routes
router.route('/')
  .post(studentValidation, createStudent)
  .get(getAllStudents);

router.get('/search', searchStudents);
router.post('/bulk', upload.single('file'), bulkCreateStudents);
router.get('/group/:groupId', getStudentsByGroup);
router.patch('/:id/toggle-status', toggleStudentStatus);

router.route('/:id')
  .get(getStudent)
  .put(studentValidation, updateStudent)
  .delete(deleteStudent);

module.exports = router;