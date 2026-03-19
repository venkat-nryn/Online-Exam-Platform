const mongoose = require('mongoose');

const examAssignmentSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'started', 'completed', 'auto-submitted'],
    default: 'pending'
  }
});

// Ensure either student or group is provided
examAssignmentSchema.pre('save', function(next) {
  if (!this.student && !this.group) {
    next(new Error('Either student or group must be provided'));
  }
  next();
});

module.exports = mongoose.model('ExamAssignment', examAssignmentSchema);