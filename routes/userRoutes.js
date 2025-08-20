const express = require('express');
const router = express.Router();
const { updatePhoto } = require("../controllers/userController");
const { getProfile, getMyCourses, enrollUserInCourse, updateProfilePhoto, SelectCourses} = require("../controllers/userController");
const authenticate = require("../middleware/authenticate");
const multer = require("multer");
const path = require("path");
const User = require('../models/User');
const Course = require('../models/Course');
const { getDashboardData } = require("../controllers/userController");
const { getAllUsers } = require('../controllers/userController');
const fs = require('fs'); // ✅ Add thi
const userController = require('../controllers/userController');



// Setup multer for photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

// Routes
router.get("/profile", authenticate, getProfile);
router.get("/my-courses", authenticate, getMyCourses);
router.get("/my-coursess", authenticate, SelectCourses);
router.post("/enroll/:courseId", authenticate, enrollUserInCourse);

// ✅ Add this route for updating the photo
router.put("/update-photo", authenticate, upload.single("photo"), updateProfilePhoto);

router.post('/:userId/buy-course/:courseId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const course = await Course.findById(req.params.courseId);

    if (!user || !course) {
      return res.status(404).json({ message: 'User or course not found' });
    }

    // Prevent duplicates
    if (user.paidCourses.includes(course._id)) {
      return res.status(400).json({ message: 'Course already purchased' });
    }

    user.paidCourses.push(course._id);
    await user.save();

    res.json({ message: '✅ Course added to user profile', courseId: course._id });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/photo', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.photo) {
      return res.status(404).send('Photo not found');
    }

    const filePath = path.join(__dirname, '..', 'uploads', user.photo);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on disk');
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Error fetching user photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/', getAllUsers);

router.get("/dashboard", authenticate, getDashboardData);

// Get available live sessions for student's enrolled courses
router.get('/available-live-sessions', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user with populated courses and fully populated instructors
        const user = await User.findById(userId).populate({
            path: 'paidCourses',
            select: 'title _id instructor',
            populate: {
                path: 'instructor',
                model: 'Instructor', // Explicitly specify the model
                select: 'name' // Only get the name field
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get active rooms from the server's activeRooms object
        const activeRooms = req.app.get('activeRooms');
        const availableSessions = [];

        // Convert activeRooms object to array and filter
        for (const [roomId, roomData] of Object.entries(activeRooms)) {
            // Check if student is enrolled in this course
            const isEnrolled = user.paidCourses.some(
                course => course._id.toString() === roomData.courseId
            );

            if (isEnrolled) {
                const course = user.paidCourses.find(
                    c => c._id.toString() === roomData.courseId
                );
                
                // Debug log to check course data
                console.log('Course data:', {
                    id: course?._id,
                    title: course?.title,
                    instructor: course?.instructor
                });

                availableSessions.push({
                    roomId,
                    courseId: roomData.courseId,
                    courseTitle: course?.title || 'Unknown Course',
                    instructorName: course?.instructor?.name || 'Unknown Instructor',
                    studentCount: Object.keys(roomData.students || {}).length,
                    startedAt: roomData.createdAt
                });
            }
        }

        res.status(200).json({ data: availableSessions });
    } catch (error) {
        console.error("Error fetching available live sessions:", error);
        res.status(500).json({ 
            message: "Error fetching live sessions",
            error: error.message 
        });
    }
});

// routes/userRoutes.js
router.put("/update-info", authenticate, userController.updateUserInfo);
router.put("/change-password", authenticate, userController.changeUserPassword);


module.exports = router;
