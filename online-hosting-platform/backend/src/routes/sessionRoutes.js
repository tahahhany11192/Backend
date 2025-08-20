const express = require('express');
const SessionController = require('../controllers/sessionController');

const router = express.Router();
const sessionController = new SessionController();

// Route to create a new session
router.post('/sessions', sessionController.createSession.bind(sessionController));

// Route to get a session by ID
router.get('/sessions/:sessionId', sessionController.getSession.bind(sessionController));

// Route to end a session
router.delete('/sessions/:sessionId', sessionController.endSession.bind(sessionController));

module.exports = router;