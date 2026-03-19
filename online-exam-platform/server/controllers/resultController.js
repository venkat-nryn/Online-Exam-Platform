const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const ExamAttempt = require('../models/ExamAttempt');
const Question = require('../models/Question');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// @desc    Get all results
// @route   GET /api/results
// @access  Private (Admin only)
const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('exam', 'examName totalMarks passMark')
      .populate('student', 'name rollNumber email group')
      .populate('publishedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Get all results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    });
  }
};

// @desc    Get results by exam
// @route   GET /api/results/exam/:examId
// @access  Private (Admin only)
const getResultsByExam = async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.examId })
      .populate('student', 'name rollNumber email group')
      .populate('attempt')
      .sort('-obtainedMarks');

    // Calculate statistics
    const stats = {
      totalStudents: results.length,
      passed: results.filter(r => r.isPassed).length,
      failed: results.filter(r => !r.isPassed).length,
      averageMarks: results.reduce((acc, r) => acc + r.obtainedMarks, 0) / results.length || 0,
      highestMarks: Math.max(...results.map(r => r.obtainedMarks), 0),
      lowestMarks: Math.min(...results.map(r => r.obtainedMarks), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        results,
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Get results by exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    });
  }
};

// @desc    Get student result for an exam
// @route   GET /api/results/student/:studentId/exam/:examId
// @access  Private (Admin & Student)
const getStudentExamResult = async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student or exam id'
      });
    }

    // Check authorization
    if (req.userType === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this result'
      });
    }

    const result = await Result.findOne({
      student: studentId,
      exam: examId
    })
    .populate('exam', 'examName totalMarks passMark date')
    .populate('student', 'name rollNumber email group')
    .populate('attempt');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    const attempt = await ExamAttempt.findById(result.attempt)
      .populate({
        path: 'answers.questionId',
        model: 'Question',
        select: 'question options correctAnswer marks'
      });

    const answers = (attempt?.answers || []).map((answer) => {
      const answerObj = answer.toObject ? answer.toObject() : answer;
      const isCorrect = Boolean(
        answerObj.answer &&
        answerObj.questionId &&
        answerObj.answer === answerObj.questionId.correctAnswer
      );

      return {
        ...answerObj,
        isCorrect
      };
    });

    res.status(200).json({
      success: true,
      data: {
        result,
        answers
      }
    });
  } catch (error) {
    logger.error('Get student exam result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching result'
    });
  }
};

// @desc    Get student's all results
// @route   GET /api/results/student/:studentId
// @access  Private (Admin & Student)
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check authorization
    if (req.userType === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these results'
      });
    }

    const results = await Result.find({ 
      student: studentId
    })
    .populate('exam', 'examName totalMarks passMark date')
    .sort('-createdAt');

    // Calculate overall statistics
    const stats = {
      totalExams: results.length,
      passed: results.filter(r => r.isPassed).length,
      failed: results.filter(r => !r.isPassed).length,
      averagePercentage: results.reduce((acc, r) => acc + r.percentage, 0) / results.length || 0,
      highestScore: Math.max(...results.map(r => r.percentage), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        results,
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Get student results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    });
  }
};

// @desc    Update result marks manually
// @route   PUT /api/results/:resultId
// @access  Private (Admin only)
const updateResultMarks = async (req, res) => {
  try {
    const { obtainedMarks, remarks } = req.body;

    const result = await Result.findById(req.params.resultId)
      .populate('exam')
      .populate('attempt');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Validate marks
    if (obtainedMarks < 0 || obtainedMarks > result.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${result.totalMarks}`
      });
    }

    // Update result
    result.obtainedMarks = obtainedMarks;
    result.percentage = (obtainedMarks / result.totalMarks) * 100;
    result.isPassed = obtainedMarks >= result.exam.passMark;
    result.remarks = remarks;
    await result.save();

    // Update attempt answers marks if needed
    if (req.body.answers) {
      const attempt = await ExamAttempt.findById(result.attempt);
      attempt.answers = req.body.answers;
      await attempt.save();
    }

    logger.info(`Result updated for student ${result.student} in exam ${result.exam.examName}`);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Update result marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating result'
    });
  }
};

// @desc    Publish results for an exam
// @route   PUT /api/results/publish/:examId
// @access  Private (Admin only)
const publishResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Update all results for this exam
    const updateResult = await Result.updateMany(
      { exam: examId },
      { 
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user.id
      }
    );

    // Update exam
    exam.isResultPublished = true;
    await exam.save();

    logger.info(`Results published for exam: ${exam.examName}`);

    res.status(200).json({
      success: true,
      message: `Successfully published ${updateResult.modifiedCount} results`,
      data: {
        examId: exam._id,
        examName: exam.examName,
        publishedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Publish results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing results'
    });
  }
};

// @desc    Unpublish results for an exam
// @route   PUT /api/results/unpublish/:examId
// @access  Private (Admin only)
const unpublishResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Update all results for this exam
    const updateResult = await Result.updateMany(
      { exam: examId },
      { 
        isPublished: false,
        publishedAt: null,
        publishedBy: null
      }
    );

    // Update exam
    exam.isResultPublished = false;
    await exam.save();

    logger.info(`Results unpublished for exam: ${exam.examName}`);

    res.status(200).json({
      success: true,
      message: `Successfully unpublished ${updateResult.modifiedCount} results`
    });
  } catch (error) {
    logger.error('Unpublish results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unpublishing results'
    });
  }
};

// @desc    Generate result analytics
// @route   GET /api/results/analytics/:examId
// @access  Private (Admin only)
const getResultAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await Result.find({ exam: examId })
      .populate('student', 'group');

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No results available for analytics'
        }
      });
    }

    // Overall statistics
    const totalStudents = results.length;
    const passed = results.filter(r => r.isPassed).length;
    const failed = results.filter(r => !r.isPassed).length;
    const passPercentage = (passed / totalStudents) * 100;

    const marks = results.map(r => r.obtainedMarks);
    const percentages = results.map(r => r.percentage);

    const analytics = {
      overall: {
        totalStudents,
        passed,
        failed,
        passPercentage,
        averageMarks: marks.reduce((a, b) => a + b, 0) / totalStudents,
        highestMarks: Math.max(...marks),
        lowestMarks: Math.min(...marks),
        averagePercentage: percentages.reduce((a, b) => a + b, 0) / totalStudents,
        highestPercentage: Math.max(...percentages),
        lowestPercentage: Math.min(...percentages)
      },
      gradeDistribution: {
        'A+ (>90%)': results.filter(r => r.percentage >= 90).length,
        'A (80-89%)': results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
        'B (70-79%)': results.filter(r => r.percentage >= 70 && r.percentage < 80).length,
        'C (60-69%)': results.filter(r => r.percentage >= 60 && r.percentage < 70).length,
        'D (50-59%)': results.filter(r => r.percentage >= 50 && r.percentage < 60).length,
        'F (<50%)': results.filter(r => r.percentage < 50).length
      },
      performanceByGroup: {}
    };

    // Group-wise performance
    const groupMap = new Map();
    for (const result of results) {
      const groupId = result.student.group?.toString() || 'unassigned';
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          total: 0,
          passed: 0,
          totalMarks: 0
        });
      }
      
      const groupStats = groupMap.get(groupId);
      groupStats.total++;
      if (result.isPassed) groupStats.passed++;
      groupStats.totalMarks += result.obtainedMarks;
    }

    groupMap.forEach((stats, groupId) => {
      analytics.performanceByGroup[groupId] = {
        totalStudents: stats.total,
        passed: stats.passed,
        passPercentage: (stats.passed / stats.total) * 100,
        averageMarks: stats.totalMarks / stats.total
      };
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get result analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating analytics'
    });
  }
};

// @desc    Download result report
// @route   GET /api/results/download/:examId
// @access  Private (Admin only)
const downloadResultReport = async (req, res) => {
  try {
    const { examId } = req.params;
    const format = req.query.format || 'csv';

    const results = await Result.find({ exam: examId })
      .populate('student', 'name rollNumber email group')
      .populate('exam', 'examName totalMarks passMark')
      .lean();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this exam'
      });
    }

    // Format data for export
    const exportData = results.map(r => ({
      'Student Name': r.student.name,
      'Roll Number': r.student.rollNumber,
      'Email': r.student.email,
      'Group': r.student.group?.groupName || 'N/A',
      'Exam Name': r.exam.examName,
      'Total Marks': r.totalMarks,
      'Obtained Marks': r.obtainedMarks,
      'Percentage': r.percentage.toFixed(2),
      'Result': r.isPassed ? 'PASS' : 'FAIL',
      'Status': r.isPublished ? 'Published' : 'Draft',
      'Published At': r.publishedAt ? new Date(r.publishedAt).toLocaleString() : 'N/A'
    }));

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(exportData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`results_${examId}_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`results_${examId}_${Date.now()}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error('Download result report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading report'
    });
  }
};

module.exports = {
  getAllResults,
  getResultsByExam,
  getStudentExamResult,
  getStudentResults,
  updateResultMarks,
  publishResults,
  unpublishResults,
  getResultAnalytics,
  downloadResultReport
};