const Student = require('../models/Student');
const Group = require('../models/Group');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const logger = require('../utils/logger');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

// @desc    Generate student report
// @route   POST /api/reports/students
// @access  Private (Admin only)
const generateStudentReport = async (req, res) => {
  try {
    const { fields, filters, format = 'csv' } = req.body;

    // Build query
    let query = {};
    if (filters) {
      if (filters.group) query.group = filters.group;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { rollNumber: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }
    }

    // Get students with populated data
    const students = await Student.find(query)
      .populate('group', 'groupName year batch section')
      .lean();

    // Get additional statistics for each student
    const studentData = await Promise.all(
      students.map(async (student) => {
        const examAttempts = await ExamAttempt.countDocuments({ student: student._id });
        const results = await Result.find({ student: student._id });
        
        const avgScore = results.length > 0
          ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length
          : 0;

        return {
          ...student,
          examAttempts,
          totalExams: results.length,
          averageScore: avgScore.toFixed(2),
          lastLogin: student.lastLogin ? new Date(student.lastLogin).toLocaleString() : 'Never'
        };
      })
    );

    // Select fields
    let exportData = studentData;
    if (fields && fields.length > 0) {
      exportData = studentData.map(student => {
        const selected = {};
        fields.forEach(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (student[parent] && student[parent][child]) {
              selected[field] = student[parent][child];
            }
          } else {
            selected[field] = student[field];
          }
        });
        return selected;
      });
    }

    // Generate file
    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(exportData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`students_report_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`students_report_${Date.now()}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating student report'
    });
  }
};

// @desc    Generate exam report
// @route   POST /api/reports/exams
// @access  Private (Admin only)
const generateExamReport = async (req, res) => {
  try {
    const { fields, filters, format = 'csv' } = req.body;

    // Build query
    let query = {};
    if (filters) {
      if (filters.status) query.status = filters.status;
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
      }
      if (filters.search) {
        query.examName = { $regex: filters.search, $options: 'i' };
      }
    }

    // Get exams with statistics
    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .lean();

    const examData = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await ExamAttempt.countDocuments({ exam: exam._id });
        const assignments = await ExamAttempt.countDocuments({ exam: exam._id });
        const results = await Result.find({ exam: exam._id });
        
        const avgScore = results.length > 0
          ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length
          : 0;

        return {
          ...exam,
          questionCount,
          totalAssignments: assignments,
          totalAttempts: results.length,
          averageScore: avgScore.toFixed(2),
          passCount: results.filter(r => r.isPassed).length,
          failCount: results.filter(r => !r.isPassed).length,
          createdByName: exam.createdBy?.name || 'N/A'
        };
      })
    );

    // Select fields
    let exportData = examData;
    if (fields && fields.length > 0) {
      exportData = examData.map(exam => {
        const selected = {};
        fields.forEach(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (exam[parent] && exam[parent][child]) {
              selected[field] = exam[parent][child];
            }
          } else {
            selected[field] = exam[field];
          }
        });
        return selected;
      });
    }

    // Generate file
    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(exportData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`exams_report_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Exams');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`exams_report_${Date.now()}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error('Generate exam report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating exam report'
    });
  }
};

// @desc    Generate result report
// @route   POST /api/reports/results
// @access  Private (Admin only)
const generateResultReport = async (req, res) => {
  try {
    const { fields, filters, format = 'csv' } = req.body;

    // Build query
    let query = {};
    if (filters) {
      if (filters.exam) query.exam = filters.exam;
      if (filters.student) query.student = filters.student;
      if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;
      if (filters.isPassed !== undefined) query.isPassed = filters.isPassed;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    // Get results with populated data
    const results = await Result.find(query)
      .populate('exam', 'examName totalMarks passMark')
      .populate('student', 'name rollNumber email group')
      .populate('publishedBy', 'name email')
      .lean();

    // Format data
    const exportData = results.map(result => ({
      ...result,
      examName: result.exam?.examName || 'N/A',
      totalMarks: result.exam?.totalMarks || 0,
      passMark: result.exam?.passMark || 0,
      studentName: result.student?.name || 'N/A',
      rollNumber: result.student?.rollNumber || 'N/A',
      studentEmail: result.student?.email || 'N/A',
      publishedByName: result.publishedBy?.name || 'N/A',
      publishedAt: result.publishedAt ? new Date(result.publishedAt).toLocaleString() : 'N/A',
      createdAt: new Date(result.createdAt).toLocaleString()
    }));

    // Select fields
    let finalData = exportData;
    if (fields && fields.length > 0) {
      finalData = exportData.map(result => {
        const selected = {};
        fields.forEach(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (result[parent] && result[parent][child]) {
              selected[field] = result[parent][child];
            }
          } else {
            selected[field] = result[field];
          }
        });
        return selected;
      });
    }

    // Generate file
    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(finalData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`results_report_${Date.now()}.csv`);
      return res.send(csv);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(finalData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`results_report_${Date.now()}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    logger.error('Generate result report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating result report'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const totalGroups = await Group.countDocuments();
    const totalExams = await Exam.countDocuments();
    const publishedExams = await Exam.countDocuments({ status: 'published' });
    const completedExams = await Exam.countDocuments({ status: 'completed' });

    // Get today's exams
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayExams = await Exam.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).countDocuments();

    // Get recent results
    const recentResults = await Result.find()
      .populate('student', 'name rollNumber')
      .populate('exam', 'examName')
      .sort('-createdAt')
      .limit(10);

    // Get exam performance stats
    const examStats = await Exam.aggregate([
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'exam',
          as: 'results'
        }
      },
      {
        $project: {
          examName: 1,
          totalStudents: { $size: '$results' },
          passedStudents: {
            $size: {
              $filter: {
                input: '$results',
                as: 'result',
                cond: '$$result.isPassed'
              }
            }
          }
        }
      },
      {
        $sort: { totalStudents: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get activity timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activity = await Result.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          inactiveStudents: totalStudents - activeStudents,
          totalGroups,
          totalExams,
          publishedExams,
          completedExams,
          todayExams
        },
        recentResults,
        topExams: examStats,
        activity: activity.map(a => ({
          date: a._id,
          submissions: a.count
        }))
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// @desc    Export all data
// @route   GET /api/reports/export-all
// @access  Private (Admin only)
const exportAllData = async (req, res) => {
  try {
    const format = req.query.format || 'excel';

    // Fetch all data
    const students = await Student.find().populate('group').lean();
    const groups = await Group.find().lean();
    const exams = await Exam.find().lean();
    const results = await Result.find()
      .populate('student', 'name rollNumber')
      .populate('exam', 'examName')
      .lean();

    // Prepare workbook
    const workbook = XLSX.utils.book_new();

    // Students sheet
    const studentsSheet = XLSX.utils.json_to_sheet(
      students.map(s => ({
        Name: s.name,
        'Roll Number': s.rollNumber,
        Email: s.email,
        Group: s.group?.groupName || 'N/A',
        Active: s.isActive ? 'Yes' : 'No',
        'Last Login': s.lastLogin ? new Date(s.lastLogin).toLocaleString() : 'Never',
        'Created At': new Date(s.createdAt).toLocaleString()
      }))
    );
    XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

    // Groups sheet
    const groupsSheet = XLSX.utils.json_to_sheet(
      groups.map(g => ({
        'Group Name': g.groupName,
        Year: g.year,
        Batch: g.batch,
        Section: g.section,
        Description: g.description || '',
        'Student Count': g.studentCount,
        'Created At': new Date(g.createdAt).toLocaleString()
      }))
    );
    XLSX.utils.book_append_sheet(workbook, groupsSheet, 'Groups');

    // Exams sheet
    const examsSheet = XLSX.utils.json_to_sheet(
      exams.map(e => ({
        'Exam Name': e.examName,
        Date: new Date(e.date).toLocaleDateString(),
        'Start Time': e.startTime,
        'Duration (mins)': e.duration,
        'Total Marks': e.totalMarks,
        'Pass Mark': e.passMark,
        Status: e.status,
        'Results Published': e.isResultPublished ? 'Yes' : 'No',
        'Created At': new Date(e.createdAt).toLocaleString()
      }))
    );
    XLSX.utils.book_append_sheet(workbook, examsSheet, 'Exams');

    // Results sheet
    const resultsSheet = XLSX.utils.json_to_sheet(
      results.map(r => ({
        'Student Name': r.student?.name || 'N/A',
        'Exam Name': r.exam?.examName || 'N/A',
        'Total Marks': r.totalMarks,
        'Obtained Marks': r.obtainedMarks,
        'Percentage': r.percentage.toFixed(2),
        'Result': r.isPassed ? 'PASS' : 'FAIL',
        'Published': r.isPublished ? 'Yes' : 'No',
        'Published At': r.publishedAt ? new Date(r.publishedAt).toLocaleString() : 'N/A',
        'Created At': new Date(r.createdAt).toLocaleString()
      }))
    );
    XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Results');

    // Generate file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`complete_export_${Date.now()}.xlsx`);
    return res.send(buffer);
  } catch (error) {
    logger.error('Export all data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data'
    });
  }
};

module.exports = {
  generateStudentReport,
  generateExamReport,
  generateResultReport,
  getDashboardStats,
  exportAllData
};