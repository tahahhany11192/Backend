const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const lessonController = require("../controllers/lessonController");
const authenticate = require('../middleware/authenticate');
const Content = require('../models/Content');
// 🛠️ PUT update lesson with file uploads
router.put("/:id", upload.fields([
  { name: "video", maxCount: 1 },
  { name: "pdf", maxCount: 1 }
]), lessonController.updateLesson);



// ✅ 1. More specific routes go first
router.get('/courses/:courseId/lessons', lessonController.getLessonsByCourse);
router.delete('/lessons/:lessonId', lessonController.deleteLesson);

// ✅ 2. Then general ID-based routes
router.get('/:lessonId', lessonController.getLessonById);
router.put('/:lessonId', lessonController.updateLesson);

router.get('/by-course/:courseId', authenticate, async (req, res) => {
  try {
    const lessons = await Content.find({ course: req.params.courseId }).sort({ createdAt: 1 });
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




module.exports = router;
