const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const upload = require('../middleware/upload'); // multer configured to store screenshots
const controller = require('../controllers/paymentRequestController');

// student/instructor creates payment request
router.post('/submit', authenticate, upload.single('screenshot'), controller.createPaymentRequest);

// user lists own requests
router.get('/my-requests', authenticate, controller.getMyRequests);

// admin views all
router.get('/all', authenticateAdmin, controller.getAllRequests);

// routes/paymentRequestRoutes.js
router.get('/user/:userId', authenticate, controller.getUserRequests);


// admin approve/reject
router.patch('/approve/:id', authenticateAdmin, controller.approveRequest);
router.patch('/reject/:id', authenticateAdmin, controller.rejectRequest);

module.exports = router;
