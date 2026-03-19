const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, 'Please provide group name'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Please provide year']
  },
  batch: {
    type: String,
    required: [true, 'Please provide batch']
  },
  section: {
    type: String,
    required: [true, 'Please provide section']
  },
  description: {
    type: String,
    trim: true
  },
  studentCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for students
groupSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'group'
});

// Ensure unique combination
groupSchema.index({ groupName: 1, year: 1, batch: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);