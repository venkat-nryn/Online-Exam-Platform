const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: [true, 'Please provide exam name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide exam date']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Please provide duration']
  },
  passMark: {
    type: Number,
    required: [true, 'Please provide pass mark']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Please provide total marks']
  },
  instructions: {
    type: String,
    default: 'Read the questions carefully before answering.'
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    enableFullScreen: {
      type: Boolean,
      default: true
    },
    enableTabSwitchDetection: {
      type: Boolean,
      default: true
    },
    autoSubmitOnViolation: {
      type: Boolean,
      default: true
    },
    maxViolations: {
      type: Number,
      default: 3
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'in-progress', 'completed'],
    default: 'draft'
  },
  isResultPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for questions
examSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'exam'
});

module.exports = mongoose.model('Exam', examSchema);