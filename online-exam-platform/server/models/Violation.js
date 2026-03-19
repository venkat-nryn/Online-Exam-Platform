const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  type: {
    type: String,
    enum: ['fullscreen_exit', 'tab_switch', 'window_blur', 'copy_attempt', 'multiple_tabs'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

module.exports = mongoose.model('Violation', violationSchema);