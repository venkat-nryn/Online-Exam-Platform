const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Login user (Admin or Student)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    let userType;

    // Check if admin login
    if (role === 'admin') {
      user = await Admin.findOne({ email }).select('+password');
      userType = 'admin';
    } else {
      // Student login
      user = await Student.findOne({ email }).select('+password');
      userType = 'student';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login for student
    if (userType === 'student') {
      await Student.findByIdAndUpdate(user._id, {
        lastLogin: new Date()
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    logger.info(`${userType} login successful: ${email}`);

    res.status(200).json({
      success: true,
      token,
      user,
      userType
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let user;
    
    if (req.userType === 'admin') {
      user = await Admin.findById(req.user.id);
    } else {
      user = await Student.findById(req.user.id).populate('group');
    }

    res.status(200).json({
      success: true,
      user,
      userType: req.userType
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    let user;
    
    if (req.userType === 'admin') {
      user = await Admin.findById(req.user.id).select('+password');
    } else {
      user = await Student.findById(req.user.id).select('+password');
    }

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for ${req.userType}: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};