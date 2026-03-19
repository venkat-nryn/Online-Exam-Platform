const Student = require('../models/Student');
const Group = require('../models/Group');
const ExamAssignment = require('../models/ExamAssignment');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
const createStudent = async (req, res) => {
  try {
    const { name, rollNumber, email, password, group } = req.body;

    // Check if group exists
    const groupExists = await Group.findById(group);
    if (!groupExists) {
      return res.status(400).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if student with same roll number or email exists
    const existingStudent = await Student.findOne({
      $or: [{ rollNumber }, { email }]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number or email already exists'
      });
    }

    // Create student
    const student = await Student.create({
      name,
      rollNumber,
      email,
      password,
      group
    });

    // Update group student count
    await Group.findByIdAndUpdate(group, {
      $inc: { studentCount: 1 }
    });

    logger.info(`Student created: ${name} (${rollNumber})`);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating student'
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin only)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('group', 'groupName year batch section')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Admin only)
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('group', 'groupName year batch section');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's exam statistics
    const examAttempts = await ExamAttempt.find({ student: req.params.id })
      .populate('exam', 'examName totalMarks passMark');

    const results = await Result.find({ student: req.params.id })
      .populate('exam', 'examName');

    res.status(200).json({
      success: true,
      data: {
        student,
        statistics: {
          totalExams: examAttempts.length,
          completedExams: examAttempts.filter(a => a.status === 'completed').length,
          averageScore: results.length > 0 
            ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
            : 0
        },
        examHistory: examAttempts
      }
    });
  } catch (error) {
    logger.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student'
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
const updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, email, password, group, isActive } = req.body;

    // Check if student exists
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicate roll number/email if changed
    if (rollNumber !== student.rollNumber || email !== student.email) {
      const existingStudent = await Student.findOne({
        $or: [
          { rollNumber, _id: { $ne: req.params.id } },
          { email, _id: { $ne: req.params.id } }
        ]
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student with this roll number or email already exists'
        });
      }
    }

    // Check if group changed
    if (group && group.toString() !== student.group.toString()) {
      // Decrement old group count
      await Group.findByIdAndUpdate(student.group, {
        $inc: { studentCount: -1 }
      });

      // Increment new group count
      await Group.findByIdAndUpdate(group, {
        $inc: { studentCount: 1 }
      });
    }

    // Prepare update data
    const updateData = {
      name,
      rollNumber,
      email,
      group,
      isActive
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update student
    student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('group', 'groupName year batch section');

    logger.info(`Student updated: ${student.name} (${student.rollNumber})`);

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student'
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has active exam attempts
    const activeAttempt = await ExamAttempt.findOne({
      student: req.params.id,
      status: 'in-progress'
    });

    if (activeAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete student with active exam attempt'
      });
    }

    // Delete related records
    await ExamAssignment.deleteMany({ student: req.params.id });
    await ExamAttempt.deleteMany({ student: req.params.id });
    await Result.deleteMany({ student: req.params.id });

    // Update group student count
    await Group.findByIdAndUpdate(student.group, {
      $inc: { studentCount: -1 }
    });

    await student.deleteOne();

    logger.info(`Student deleted: ${student.name} (${student.rollNumber})`);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    logger.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting student'
    });
  }
};

// @desc    Bulk create students from Excel/CSV
// @route   POST /api/students/bulk
// @access  Private (Admin only)
const bulkCreateStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      successful: [],
      failed: [],
      total: data.length
    };

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.Name || !row.RollNumber || !row.Email || !row.Password || !row.Group) {
          results.failed.push({
            data: row,
            reason: 'Missing required fields'
          });
          continue;
        }

        // Find group
        const group = await Group.findOne({ groupName: row.Group });
        if (!group) {
          results.failed.push({
            data: row,
            reason: 'Group not found'
          });
          continue;
        }

        // Check for duplicate
        const existingStudent = await Student.findOne({
          $or: [
            { rollNumber: row.RollNumber },
            { email: row.Email }
          ]
        });

        if (existingStudent) {
          results.failed.push({
            data: row,
            reason: 'Student already exists'
          });
          continue;
        }

        // Create student
        const student = await Student.create({
          name: row.Name,
          rollNumber: row.RollNumber,
          email: row.Email,
          password: row.Password,
          group: group._id
        });

        // Update group count
        await Group.findByIdAndUpdate(group._id, {
          $inc: { studentCount: 1 }
        });

        results.successful.push({
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber
        });
      } catch (error) {
        results.failed.push({
          data: row,
          reason: error.message
        });
      }
    }

    logger.info(`Bulk student creation completed. Success: ${results.successful.length}, Failed: ${results.failed.length}`);

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.successful.length} students`,
      data: results
    });
  } catch (error) {
    logger.error('Bulk create students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk creating students'
    });
  }
};

// @desc    Get students by group
// @route   GET /api/students/group/:groupId
// @access  Private (Admin only)
const getStudentsByGroup = async (req, res) => {
  try {
    const students = await Student.find({ group: req.params.groupId })
      .populate('group', 'groupName year batch section')
      .sort('rollNumber');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    logger.error('Get students by group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
};

// @desc    Search students
// @route   GET /api/students/search
// @access  Private (Admin only)
const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search query'
      });
    }

    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { rollNumber: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('group', 'groupName year batch section')
    .limit(20);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    logger.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching students'
    });
  }
};

// @desc    Toggle student active status
// @route   PATCH /api/students/:id/toggle-status
// @access  Private (Admin only)
const toggleStudentStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.isActive = !student.isActive;
    await student.save();

    logger.info(`Student status toggled: ${student.name} - Active: ${student.isActive}`);

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('Toggle student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling student status'
    });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentsByGroup,
  searchStudents,
  toggleStudentStatus
};