const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    let user = await Admin.findById(decoded.id);
    if (user) {
      req.user = user;
      req.userType = 'admin';
      return next();
    }

    // Check if user is student
    user = await Student.findById(decoded.id);
    if (user) {
      req.user = user;
      req.userType = 'student';
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

module.exports = { protect };