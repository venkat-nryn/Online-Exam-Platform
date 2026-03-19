const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAssignment = require('../models/ExamAssignment');
const ExamAttempt = require('../models/ExamAttempt');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Group = require('../models/Group');
const logger = require('../utils/logger');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin only)
const createExam = async (req, res) => {
  try {
    const {
      examName,
      date,
      startTime,
      duration,
      passMark,
      totalMarks,
      instructions,
      settings
    } = req.body;

    const exam = await Exam.create({
      examName,
      date,
      startTime,
      duration,
      passMark,
      totalMarks,
      instructions,
      settings,
      createdBy: req.user.id
    });

    logger.info(`Exam created: ${examName}`);

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    logger.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating exam'
    });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin only)
const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    // Get question counts for each exam
    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ exam: exam._id });
        const assignmentCount = await ExamAssignment.countDocuments({ exam: exam._id });
        return {
          ...exam.toObject(),
          questionCount,
          assignmentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: exams.length,
      data: examsWithStats
    });
  } catch (error) {
    logger.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams'
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private (Admin only)
const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get questions
    const questions = await Question.find({ exam: req.params.id }).sort('order');

    // Get assignments
    const assignments = await ExamAssignment.find({ exam: req.params.id })
      .populate('student', 'name rollNumber email')
      .populate('group', 'groupName');

    res.status(200).json({
      success: true,
      data: {
        exam,
        questions,
        assignments
      }
    });
  } catch (error) {
    logger.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam'
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin only)
const updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam has started
    if (exam.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update exam that is in progress'
      });
    }

    const updateData = {
      ...req.body
    };

    if (updateData.settings) {
      updateData.settings = {
        ...exam.settings?.toObject?.(),
        ...updateData.settings
      };
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    logger.info(`Exam updated: ${exam.examName}`);

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    logger.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating exam'
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin only)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if exam has attempts
    const attemptCount = await ExamAttempt.countDocuments({ exam: req.params.id });
    if (attemptCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam with student attempts'
      });
    }

    // Delete related records
    await Question.deleteMany({ exam: req.params.id });
    await ExamAssignment.deleteMany({ exam: req.params.id });

    await exam.deleteOne();

    logger.info(`Exam deleted: ${exam.examName}`);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    logger.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting exam'
    });
  }
};

// @desc    Add questions manually
// @route   POST /api/exams/:id/questions
// @access  Private (Admin only)
const addQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate total marks
    const totalMarksFromQuestions = questions.reduce((sum, q) => sum + Number(q.marks), 0);
    if (totalMarksFromQuestions !== exam.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Total marks from questions (${totalMarksFromQuestions}) does not match exam total marks (${exam.totalMarks})`
      });
    }

    // Add order to questions
    const lastQuestion = await Question.findOne({ exam: req.params.id })
      .sort('-order');
    let order = lastQuestion ? lastQuestion.order + 1 : 0;

    const questionsToAdd = questions.map((q, index) => ({
      ...q,
      exam: req.params.id,
      order: order + index
    }));

    const createdQuestions = await Question.insertMany(questionsToAdd);

    logger.info(`${questions.length} questions added to exam: ${exam.examName}`);

    res.status(201).json({
      success: true,
      count: createdQuestions.length,
      data: createdQuestions
    });
  } catch (error) {
    logger.error('Add questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding questions'
    });
  }
};

// @desc    Upload questions via Excel
// @route   POST /api/exams/:id/questions/upload
// @access  Private (Admin only)
const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const questions = [];
    let totalMarks = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Validate required fields
      if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectAnswer || !row.Marks) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields in row ${i + 2}`
        });
      }

      // Validate correct answer
      if (!['A', 'B', 'C', 'D'].includes(row.CorrectAnswer)) {
        return res.status(400).json({
          success: false,
          message: `Invalid correct answer in row ${i + 2}. Must be A, B, C, or D`
        });
      }

      const marks = parseFloat(row.Marks);
      if (isNaN(marks) || marks < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid marks in row ${i + 2}`
        });
      }

      totalMarks += marks;

      questions.push({
        exam: req.params.id,
        question: row.Question,
        options: {
          A: row.OptionA,
          B: row.OptionB,
          C: row.OptionC,
          D: row.OptionD
        },
        correctAnswer: row.CorrectAnswer,
        marks: marks,
        order: i
      });
    }

    // Validate total marks
    if (totalMarks !== exam.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Total marks from questions (${totalMarks}) does not match exam total marks (${exam.totalMarks})`
      });
    }

    // Delete existing questions if any
    await Question.deleteMany({ exam: req.params.id });

    // Insert new questions
    const createdQuestions = await Question.insertMany(questions);

    logger.info(`${questions.length} questions uploaded to exam: ${exam.examName}`);

    res.status(201).json({
      success: true,
      count: createdQuestions.length,
      message: `Successfully uploaded ${createdQuestions.length} questions`,
      data: createdQuestions
    });
  } catch (error) {
    logger.error('Upload questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading questions'
    });
  }
};

// @desc    Assign exam to students/groups
// @route   POST /api/exams/assign
// @access  Private (Admin only)
const assignExam = async (req, res) => {
  try {
    const { examId, studentIds, groupIds } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const assignments = [];
    const errors = [];

    // Assign to individual students
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        try {
          const student = await Student.findById(studentId);
          if (!student) {
            errors.push(`Student ${studentId} not found`);
            continue;
          }

          // Check if already assigned
          const existing = await ExamAssignment.findOne({
            exam: examId,
            student: studentId
          });

          if (!existing) {
            const assignment = await ExamAssignment.create({
              exam: examId,
              student: studentId,
              assignedBy: req.user.id
            });
            assignments.push(assignment);
          }
        } catch (error) {
          errors.push(`Error assigning to student ${studentId}: ${error.message}`);
        }
      }
    }

    // Assign to groups
    if (groupIds && groupIds.length > 0) {
      for (const groupId of groupIds) {
        try {
          const group = await Group.findById(groupId);
          if (!group) {
            errors.push(`Group ${groupId} not found`);
            continue;
          }

          // Get all students in group
          const students = await Student.find({ group: groupId });

          for (const student of students) {
            const existing = await ExamAssignment.findOne({
              exam: examId,
              student: student._id
            });

            if (!existing) {
              const assignment = await ExamAssignment.create({
                exam: examId,
                student: student._id,
                group: groupId,
                assignedBy: req.user.id
              });
              assignments.push(assignment);
            }
          }
        } catch (error) {
          errors.push(`Error assigning to group ${groupId}: ${error.message}`);
        }
      }
    }

    logger.info(`Exam ${exam.examName} assigned to ${assignments.length} students`);

    res.status(201).json({
      success: true,
      message: `Successfully assigned to ${assignments.length} students`,
      data: {
        assignments,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    logger.error('Assign exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning exam'
    });
  }
};

// @desc    Get exam status/monitoring
// @route   GET /api/exams/:id/monitor
// @access  Private (Admin only)
const monitorExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get all attempts for this exam
    const attempts = await ExamAttempt.find({ exam: req.params.id })
      .populate('student', 'name rollNumber email group')
      .populate('violations');

    // Get assignments
    const assignments = await ExamAssignment.find({ exam: req.params.id })
      .populate('student', 'name rollNumber email group');

    // Calculate statistics
    const stats = {
      totalAssigned: assignments.length,
      totalStarted: attempts.filter(a => a.status === 'in-progress').length,
      totalCompleted: attempts.filter(a => a.status === 'completed').length,
      totalAutoSubmitted: attempts.filter(a => a.status === 'auto-submitted').length,
      averageViolations: attempts.reduce((acc, a) => acc + a.violationCount, 0) / attempts.length || 0
    };

    // Get live students (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const liveStudents = attempts.filter(a => 
      a.status === 'in-progress' && 
      a.autoSavedAt && 
      a.autoSavedAt > fiveMinutesAgo
    );

    res.status(200).json({
      success: true,
      data: {
        exam,
        stats,
        liveStudents: liveStudents.length,
        attempts: attempts.map(a => ({
          id: a._id,
          student: a.student,
          status: a.status,
          startTime: a.startTime,
          endTime: a.endTime,
          violationCount: a.violationCount,
          lastActive: a.autoSavedAt
        }))
      }
    });
  } catch (error) {
    logger.error('Monitor exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while monitoring exam'
    });
  }
};

// @desc    Start exam (student)
// @route   POST /api/exams/:id/start
// @access  Private (Student only)
const startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if student is assigned
    const assignmentFilter = {
      exam: req.params.id,
      $or: [
        { student: req.user.id },
        {
          group: req.user.group,
          $or: [{ student: { $exists: false } }, { student: null }]
        }
      ]
    };

    const assignment = await ExamAssignment.findOne(assignmentFilter);

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this exam'
      });
    }

    const buildExamWindow = () => {
      const examDate = new Date(exam.date);
      const startTime = (exam.startTime || '').trim();
      const [rawHour, rawMinute] = startTime.split(':');
      const hour = Number.parseInt(rawHour, 10);
      const minute = Number.parseInt(rawMinute, 10);

      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null;
      }

      examDate.setHours(hour, minute, 0, 0);
      const examEndTime = new Date(examDate.getTime() + exam.duration * 60000);

      return { examDate, examEndTime };
    };

    const window = buildExamWindow();
    if (!window) {
      return res.status(400).json({
        success: false,
        message: 'Exam start time is invalid. Please contact admin.'
      });
    }

    const examSettings = exam.settings || {
      shuffleQuestions: false,
      shuffleOptions: false,
      enableFullScreen: true,
      enableTabSwitchDetection: true,
      autoSubmitOnViolation: true,
      maxViolations: 3
    };

    // Check if already started
    const existingAttempt = await ExamAttempt.findOne({
      exam: req.params.id,
      student: req.user.id
    });

    if (existingAttempt && existingAttempt.status === 'in-progress') {
      const questions = await Question.find({ exam: req.params.id }).sort('order');
      return res.status(200).json({
        success: true,
        data: {
          attemptId: existingAttempt._id,
          exam: {
            _id: exam._id,
            examName: exam.examName,
            duration: exam.duration,
            instructions: exam.instructions,
            settings: examSettings
          },
          questions: questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            marks: q.marks,
            order: q.order
          })),
          startTime: existingAttempt.startTime,
          endTime: window.examEndTime
        }
      });
    }

    if (existingAttempt && existingAttempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this exam'
      });
    }

    // Check exam availability
    const now = new Date();
    const examDate = window.examDate;
    const examEndTime = window.examEndTime;

    if (now < examDate) {
      return res.status(400).json({
        success: false,
        message: 'Exam has not started yet'
      });
    }

    if (now > examEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Exam time has passed'
      });
    }

    // Get questions
    const questions = await Question.find({ exam: req.params.id }).sort('order');

    // Shuffle if enabled
    let examQuestions = questions;
    if (examSettings.shuffleQuestions) {
      examQuestions = questions.sort(() => Math.random() - 0.5);
    }

    let attempt;
    try {
      // Create attempt
      attempt = await ExamAttempt.create({
        exam: req.params.id,
        student: req.user.id,
        startTime: now,
        status: 'in-progress',
        answers: examQuestions.map(q => ({
          questionId: q._id,
          answer: null,
          isVisited: false,
          isAnswered: false
        })),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (createError) {
      // Handle race condition from duplicate start requests.
      if (createError && createError.code === 11000) {
        attempt = await ExamAttempt.findOne({
          exam: req.params.id,
          student: req.user.id,
          status: 'in-progress'
        });
      } else {
        throw createError;
      }
    }

    if (!attempt) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create exam attempt'
      });
    }

    // Update assignment status
    assignment.status = 'started';
    await assignment.save();

    logger.info(`Student ${req.user.id} started exam ${exam.examName}`);

    res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        exam: {
          _id: exam._id,
          examName: exam.examName,
          duration: exam.duration,
          instructions: exam.instructions,
          settings: examSettings
        },
        questions: examQuestions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          marks: q.marks,
          order: q.order
        })),
        startTime: attempt.startTime,
        endTime: examEndTime
      }
    });
  } catch (error) {
    logger.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting exam'
    });
  }
};

// @desc    Save answer
// @route   POST /api/exams/:id/save-answer
// @access  Private (Student only)
const saveAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    const attempt = await ExamAttempt.findOne({
      exam: req.params.id,
      student: req.user.id,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active exam attempt found'
      });
    }

    // Find and update answer
    const answerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (answerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this exam'
      });
    }

    attempt.answers[answerIndex].answer = answer;
    attempt.answers[answerIndex].isAnswered = answer !== null;
    attempt.answers[answerIndex].isVisited = true;
    attempt.autoSavedAt = new Date();

    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully'
    });
  } catch (error) {
    logger.error('Save answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving answer'
    });
  }
};

// @desc    Mark question as visited
// @route   POST /api/exams/:id/mark-visited
// @access  Private (Student only)
const markVisited = async (req, res) => {
  try {
    const { questionId } = req.body;

    const attempt = await ExamAttempt.findOne({
      exam: req.params.id,
      student: req.user.id,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'No active exam attempt found'
      });
    }

    const answerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (answerIndex !== -1) {
      attempt.answers[answerIndex].isVisited = true;
      await attempt.save();
    }

    res.status(200).json({
      success: true,
      message: 'Question marked as visited'
    });
  } catch (error) {
    logger.error('Mark visited error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Submit exam
// @route   POST /api/exams/:id/submit
// @access  Private (Student only)
const submitExam = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      exam: req.params.id,
      student: req.user.id,
      status: 'in-progress'
    }).populate('exam');

    if (!attempt) {
      const existingAttempt = await ExamAttempt.findOne({
        exam: req.params.id,
        student: req.user.id,
        status: { $in: ['completed', 'auto-submitted'] }
      }).sort('-endTime');

      if (existingAttempt) {
        const existingResult = await Result.findOne({
          exam: req.params.id,
          student: req.user.id,
          attempt: existingAttempt._id
        });

        return res.status(200).json({
          success: true,
          message: 'Exam already submitted',
          data: {
            submittedAt: existingAttempt.endTime,
            resultId: existingResult?._id || null
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: 'No exam attempt found to submit'
      });
    }

    // Calculate marks
    const questions = await Question.find({ exam: req.params.id });
    let obtainedMarks = 0;

    for (const answer of attempt.answers) {
      const question = questions.find(
        q => q._id.toString() === answer.questionId.toString()
      );
      
      if (question && answer.answer === question.correctAnswer) {
        obtainedMarks += question.marks;
        answer.marksObtained = question.marks;
      }
    }

    attempt.status = 'completed';
    attempt.endTime = new Date();
    await attempt.save();

    // Create result
    const result = await Result.create({
      exam: req.params.id,
      student: req.user.id,
      attempt: attempt._id,
      totalMarks: attempt.exam.totalMarks,
      obtainedMarks,
      isPassed: obtainedMarks >= attempt.exam.passMark
    });

    // Update assignment status
    const studentAssignment = await ExamAssignment.findOneAndUpdate(
      {
        exam: req.params.id,
        student: req.user.id
      },
      {
        status: 'completed'
      }
    );

    if (!studentAssignment && req.user.group) {
      await ExamAssignment.findOneAndUpdate(
        {
          exam: req.params.id,
          group: req.user.group,
          $or: [{ student: { $exists: false } }, { student: null }]
        },
        {
          status: 'completed'
        }
      );
    }

    logger.info(`Student ${req.user.id} submitted exam ${attempt.exam.examName}`);

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        submittedAt: attempt.endTime,
        resultId: result._id
      }
    });
  } catch (error) {
    logger.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting exam'
    });
  }
};

// @desc    Report violation
// @route   POST /api/exams/:id/violation
// @access  Private (Student only)
const reportViolation = async (req, res) => {
  try {
    const { type, details } = req.body;

    const attempt = await ExamAttempt.findOne({
      exam: req.params.id,
      student: req.user.id,
      status: 'in-progress'
    }).populate('exam');

    if (!attempt) {
      return res.status(200).json({
        success: true,
        message: 'Violation ignored because exam is already submitted',
        data: {
          violationCount: 0,
          maxViolations: 0,
          shouldAutoSubmit: false,
          autoSubmitIn: null
        }
      });
    }

    // Create violation record
    const Violation = require('../models/Violation');
    const violation = await Violation.create({
      student: req.user.id,
      exam: req.params.id,
      attempt: attempt._id,
      type,
      details,
      timestamp: new Date()
    });

    // Increment violation count
    attempt.violationCount += 1;
    await attempt.save();

    // Check if max violations reached
    const examSettings = attempt.exam.settings || {};
    const maxViolations = examSettings.maxViolations || 3;
    const shouldAutoSubmit = attempt.violationCount >= maxViolations && 
                examSettings.autoSubmitOnViolation;

    res.status(200).json({
      success: true,
      message: 'Violation recorded',
      data: {
        violationCount: attempt.violationCount,
        maxViolations,
        shouldAutoSubmit,
        autoSubmitIn: shouldAutoSubmit ? 45 : null // 45 seconds warning
      }
    });
  } catch (error) {
    logger.error('Report violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting violation'
    });
  }
};

// @desc    Get student's exams
// @route   GET /api/exams/student/my-exams
// @access  Private (Student only)
const getStudentExams = async (req, res) => {
  try {
    // Get all assignments for this student (direct or via group)
    const assignmentFilter = {
      $or: [
        { student: req.user.id },
        {
          group: req.user.group,
          $or: [{ student: { $exists: false } }, { student: null }]
        }
      ]
    };

    const assignments = await ExamAssignment.find(assignmentFilter)
      .populate({
        path: 'exam',
        populate: {
          path: 'questions',
          select: 'marks'
        }
      });

    const now = new Date();
    const examMap = new Map();

    for (const assignment of assignments) {
      const exam = assignment.exam;
      if (!exam) {
        continue;
      }
      
      // Calculate exam time
      const examDate = new Date(exam.date);
      examDate.setHours(parseInt(exam.startTime.split(':')[0]));
      examDate.setMinutes(parseInt(exam.startTime.split(':')[1]));
      
      const examEndTime = new Date(examDate.getTime() + exam.duration * 60000);

      // Determine initial status from schedule
      let status = 'upcoming';
      if (now > examEndTime) {
        status = 'completed';
      } else if (now >= examDate && now <= examEndTime) {
        status = 'live';
      }

      // Get attempt if exists
      const attempt = await ExamAttempt.findOne({
        exam: exam._id,
        student: req.user.id
      });

      // Attempt/result should take precedence over schedule-based status
      if (attempt && ['completed', 'auto-submitted'].includes(attempt.status)) {
        status = 'completed';
      } else if (attempt && attempt.status === 'in-progress') {
        status = 'live';
      }

      // Get result for this student exam
      const result = await Result.findOne({
        exam: exam._id,
        student: req.user.id
      });

      if (result) {
        status = 'completed';
      }

      const examData = {
        id: exam._id,
        name: exam.examName,
        date: exam.date,
        startTime: exam.startTime,
        duration: exam.duration,
        status,
        totalMarks: exam.totalMarks,
        questionCount: exam.questions.length,
        attemptStatus: attempt ? attempt.status : 'pending',
        result: result ? {
          id: result._id,
          obtainedMarks: result.obtainedMarks,
          percentage: result.percentage,
          isPassed: result.isPassed
        } : null
      };

      const mapKey = exam._id.toString();
      const existingExam = examMap.get(mapKey);

      if (!existingExam) {
        examMap.set(mapKey, examData);
      } else {
        // Prefer completed over live/upcoming when duplicate assignments exist.
        const priority = { upcoming: 1, live: 2, completed: 3 };
        if ((priority[examData.status] || 0) >= (priority[existingExam.status] || 0)) {
          examMap.set(mapKey, examData);
        }
      }
    }

    const exams = Array.from(examMap.values());

    // Sort by date
    exams.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: exams
    });
  } catch (error) {
    logger.error('Get student exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams'
    });
  }
};

module.exports = {
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
};