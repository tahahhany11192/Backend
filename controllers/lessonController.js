const Course = require('../models/Course');
const Lesson = require('../models/Content');
const path = require('path');
const getFileUrl = (req, file) => {
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
};

exports.createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;

    const duration = req.body.duration ? parseInt(req.body.duration) : 0;
    const description = req.body.description || '';
    const video = req.files?.video?.[0]?.filename || null;
    const pdf = req.files?.pdf?.[0]?.filename || null;
    const thumbnail = req.files?.thumbnail?.[0]?.filename || null;

    const quizzes = JSON.parse(req.body.quizzes || '[]');
    const assignments = JSON.parse(req.body.assignments || '[]');
// Use MongoDB aggregation for better performance
const stats = await Course.aggregate([
  {
    $group: {
      _id: null,
      activeCourses: { $sum: 1 },
      videoLessons: { $sum: { $cond: [{ $ifNull: ["$video", false] }, 1, 0] } },
      pdfResources: { $sum: { $cond: [{ $ifNull: ["$pdf", false] }, 1, 0] } }
    }
  }
]);

    const lesson = await Lesson.create({
      course: courseId,
      title,
      video,
      pdf,
      duration,
      description: req.body.description || '',
      thumbnail,
      quizzes,
      assignments
    });



    // Optional: update course with reference
    await Course.findByIdAndUpdate(courseId, {
      $push: { lessons: lesson._id }
    });

    await lesson.save();
    res.status(201).json({ message: '✅ Lesson created', lesson });
  } catch (err) {
    console.error('❌ Error creating lesson:', err);
    res.status(500).json({ message: '❌ Failed to create lesson', error: err.message });
  }
};
    exports.getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ course: courseId }).sort({ createdAt: -1 });
    res.status(200).json(lessons);
  } catch (err) {
    console.error("Error fetching lessons:", err);
    res.status(500).json({ message: "Server error while fetching lessons" });
  }
};

// DELETE /api/lessons/:lessonId
exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const deleted = await Lesson.findByIdAndDelete(lessonId);
    if (!deleted) return res.status(404).json({ message: "Lesson not found" });
    res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error("Error deleting lesson:", err);
    res.status(500).json({ message: "Server error while deleting lesson" });
  }
};


exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if body fields are present (with multer, they are in req.body)
    const { title, description, duration } = req.body;

    const updatedLesson = await Lesson.findById(id);
    if (!updatedLesson) return res.status(404).json({ message: "Lesson not found" });

    updatedLesson.title = title;
    updatedLesson.description = description;
    updatedLesson.duration = duration;

    // 🧠 Handle uploaded files
    if (req.files.video && req.files.video[0]) {
      updatedLesson.video = `/uploads/${req.files.video[0].filename}`;
    }

    if (req.files.pdf && req.files.pdf[0]) {
      updatedLesson.pdf = `/uploads/${req.files.pdf[0].filename}`;
    }

    await updatedLesson.save();

    res.json({ message: "Lesson updated", data: updatedLesson });
  } catch (err) {
    console.error("Update lesson error:", err);
    res.status(500).json({ message: "Server error updating lesson" });
  }
};





exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json({ data: lesson });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};