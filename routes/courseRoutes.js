const express = require('express');
const router = express.Router();
const uploadLessonFiles = require('../middleware/upload');
const { createLesson } = require('../controllers/lessonController');
const Course = require('../models/Course');
const upload = require('../middleware/upload');
const {
  createCourse,
  getAllCourses,
  getCourse,
  buyCourse,
  enrollFreeCourse
} = require('../controllers/courseController');



// 🟢 Create Course (with thumbnail upload)
router.post('/create', upload.single('thumbnail'), createCourse);



// 🟢 Get all courses
router.get('/all', getAllCourses);

// 🟢 Get one course by ID
router.get('/:id', getCourse);

// Get all courses by instructor I

router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.params.instructorId }, '_id title');
    res.json({ data: courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Purchase course (for paid)
router.post('/buy/:courseId', buyCourse);

// 🟢 Enroll in free course
router.post('/enroll/:id', enrollFreeCourse);

router.post(
  '/:courseId/lessons',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdf', maxCount: 10 }  // <-- matches your frontend input name="pdfs"
  ]),
  createLesson
);

module.exports = router;
