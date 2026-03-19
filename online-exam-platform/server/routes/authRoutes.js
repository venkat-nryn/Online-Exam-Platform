const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;