const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
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
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  obtainedMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate percentage before saving
resultSchema.pre('save', function(next) {
  if (this.totalMarks > 0) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);