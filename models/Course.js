const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true }
});

const quizAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 },
  attempts: [quizAttemptSchema]
});

const assignmentSubmissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: Number,
  feedback: String
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  submissions: [assignmentSubmissionSchema]
});

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  size: Number
});

const liveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  scheduledTime: { type: Date, required: true },
  streamKey: String,
  recordingUrl: String,
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed'], 
    default: 'scheduled' 
  }
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: String,
  pdfs: [pdfSchema],
  assignments: [assignmentSchema],
  quizzes: [quizSchema]
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },

    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    Level: { type: String, required: true },
    thumbnail: { type: String },
    pdfs: [String],
lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add virtual for duration if needed
// courseSchema.virtual('duration').get(function() {
//   // calculate duration logic
// });

module.exports = mongoose.model('Course', courseSchema);