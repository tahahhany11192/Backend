const PaymentRequest = require('../models/PaymentRequest');
const Course = require('../models/Course');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Create new payment request (student/instructor)
exports.createPaymentRequest = async (req, res) => {
  try {
    const userId = req.user.userId; // from authenticate middleware
    const { courseId, amount, method, walletId } = req.body;

    if (!courseId || !amount || !method || !walletId ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // screenshot file
    const screenshot = req.file ? `/uploads/${req.file.filename}` : null;

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) return res.status(404).json({ error: 'Course not found' });

    const paymentRequest = await PaymentRequest.create({
      user: userId,
      course: courseId,
      amount,
      method,
      walletId, 

      screenshotUrl: screenshot,
    });

    res.status(201).json({ success: true, data: paymentRequest });
  } catch (err) {
    console.error('Create payment request error:', err);
    res.status(500).json({ error: 'Server error creating payment request' });
  }
};

// List current user’s payment requests
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await PaymentRequest.find({ user: userId })
      .populate('course', 'title thumbnail price')
      .sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: list all requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await PaymentRequest.find()
      .populate('user', 'name email')
      .populate('course', 'title')
      .populate('processedBy', 'username')
      .sort({ requestedAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: approve
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin; // from authenticateAdmin

    const request = await PaymentRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    request.status = 'approved';
    request.processedBy = admin._id;
    request.processedAt = new Date();
    await request.save();

    // Enroll user in the course (you likely have a user model with paidCourses)
    const user = await User.findById(request.user);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.paidCourses.includes(request.course)) {
      user.paidCourses.push(request.course);
      await user.save();
    }

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('Approve request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: reject
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const admin = req.admin;

    const request = await PaymentRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    request.status = 'rejected';
    request.processedBy = admin._id;
    request.processedAt = new Date();
    request.rejectionReason = reason || '';
    await request.save();

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// controllers/paymentRequestController.js
exports.getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await PaymentRequest.find({ user: userId }).select('course status');
    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
