class SessionController {
  constructor(sessionService) {
    this.sessionService = sessionService;
  }

  async createSession(req, res) {
    try {
      const { instructorId } = req.body;
      const session = await this.sessionService.createSession(instructorId);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: 'Error creating session', error });
    }
  }

  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.status(200).json(session);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving session', error });
    }
  }

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      await this.sessionService.endSession(sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error ending session', error });
    }
  }
}

export default SessionController;