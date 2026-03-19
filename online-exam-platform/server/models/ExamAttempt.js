const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'auto-submitted', 'abandoned'],
    default: 'in-progress'
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    answer: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null]
    },
    isVisited: {
      type: Boolean,
      default: false
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    marksObtained: {
      type: Number,
      default: 0
    }
  }],
  violationCount: {
    type: Number,
    default: 0
  },
  autoSavedAt: {
    type: Date
  },
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one attempt per exam per student
examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);