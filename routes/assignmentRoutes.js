// routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Content = require('../models/Content');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/assignments'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get assignments for logged-in student
router.get('/my-assignments', auth, async (req, res) => {
    try {
        // Find all lessons in courses the user is enrolled in
        const user = req.user; // from auth middleware
        const lessons = await Content.find({
            course: { $in: user.paidCourses }
        }).select("title assignments");

        // Flatten to get all assignments
        let assignments = [];
        lessons.forEach(lesson => {
            lesson.assignments.forEach(a => {
                assignments.push({
                    _id: a._id,
                    title: lesson.title,
                    description: a.question,
                    dueDate: a.dueDate
                });
            });
        });

        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit assignment
router.post('/submit/:assignmentId', auth, upload.single('file'), async (req, res) => {
  try {
    // Here you would store in DB or mark submission
    res.json({
      message: 'Assignment submitted successfully',
      file: req.file.filename
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

module.exports = router;
