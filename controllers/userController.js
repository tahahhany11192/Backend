const User = require('../models/User');
const Course = require('../models/Course');
const mongoose = require('mongoose');



// Helper to fetch active rooms
async function getActiveRooms() {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/active-rooms`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching active rooms:", err);
    return { data: [] };
  }
}

// Helper to format session data
function formatSessionData(sessions, userCourses) {
  return sessions.map(room => {
    const course = userCourses.find(c => c._id.toString() === room.courseId);
    return {
      roomId: room.roomId,
      courseId: room.courseId,
      courseTitle: course?.title || 'Unknown Course',
      instructorName: course?.instructor?.name || 'Unknown Instructor',
      studentCount: room.studentCount,
      startedAt: room.createdAt
    };
  });
}
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// controllers/userController.js
exports.SelectCourses = async (req, res) => {
    try {
        const userId = req.user.id; // From JWT middleware
        console.log('💡 getMyCourses called');
        console.log('👤 User ID:', userId);

        // Fetch courses the user is enrolled in
        const user = await User.findById(userId).populate('courses');
        // Or fetch all paid courses if that's what you want
        const paidCourses = await Course.find({ price: { $gt: 0 } });
        
        console.log('📦 Paid Courses:', paidCourses);

        res.json({
            status: 'success',
            data: paidCourses.map(course => ({
                _id: course._id,
                title: course.title,
                description: course.description,
                instructor: course.instructor?.name || 'Unknown',
                price: course.price,
                thumbnail: course.thumbnail
            }))
        });
    } catch (err) {
        console.error('❌ Course fetch error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch courses'
        });
    }
};

exports.getMyCourses = async (req, res) => {
  try {
    console.log("💡 getMyCourses called");

    const userId = req.user.userId;
    console.log("👤 User ID:", userId);

    const user = await User.findById(userId).populate({
      path: 'paidCourses',
      populate: {
        path: 'instructor',
        model: 'Instructor',
        select: 'name email'
      }
    });

    console.log("📦 Paid Courses:", user?.paidCourses);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.paidCourses);
  } catch (error) {
    console.error("❌ Error in getMyCourses:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const photo = req.file ? req.file.filename : null;

    if (!photo) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.photo = photo;
    await user.save();

    res.status(200).json({ message: "Profile photo updated successfully", photo });
  } catch (error) {
    console.error("Photo update error:", error);
    res.status(500).json({ message: "Error updating photo" });
  }
};



exports.enrollUserInCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = req.params.courseId;

    console.log("Course ID:", courseId);
    console.log("Decoded userId:", userId);

    const user = await User.findById(userId).populate('paidCourses');
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({ message: "User or course not found" });
    }

    // ✅ Prevent enrolling in the same course multiple times
    const alreadyEnrolled = user.paidCourses.some(c => c._id.toString() === courseId);
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "You are already enrolled in this course." });
    }

    user.paidCourses.push(course._id); // safer to use course._id
    await user.save();

    res.status(200).json({ message: "Course enrolled successfully" });
  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email age photo'); // only return selected fields
    res.status(200).json({ data: users });
  } catch (err) {
    console.error('❌ Failed to fetch users:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
exports.getAllUsers = getAllUsers;


// ✅ Dashboard Controller
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .select("name photo paidCourses")
      .populate({
        path: "paidCourses",
        select: "title thumbnail duration category Level instructor",
        populate: {
          path: "instructor",
          select: "name"
        }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      photo: user.photo,
      courses: user.paidCourses.map(course => ({
        id: course._id,
        title: course.title,
        category: course.category,
        Level: course.Level,
        thumbnail: course.thumbnail,
        pdfs: course.pdfs,
        duration: course.duration,
        instructor: course.instructor?.name || "N/A",
        progress: 0 // 📌 Placeholder (you can calculate real progress later)
      }))
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};


// ✅ Update User Info
exports.updateUserInfo = async (req, res) => {
  try {
    const updateData = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

// ✅ Change Password
exports.changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect old password" });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password" });
  }
};


