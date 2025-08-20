const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
instructorModel: { type: String, enum: ['User', 'Instructor'], required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  isLive: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', liveSessionSchema);