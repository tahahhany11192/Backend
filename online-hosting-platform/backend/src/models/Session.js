class Session {
  constructor(sessionId, instructorId, studentIds = [], status = 'active') {
    this.sessionId = sessionId;
    this.instructorId = instructorId;
    this.studentIds = studentIds;
    this.status = status;
  }

  addStudent(studentId) {
    if (!this.studentIds.includes(studentId)) {
      this.studentIds.push(studentId);
    }
  }

  removeStudent(studentId) {
    this.studentIds = this.studentIds.filter(id => id !== studentId);
  }

  endSession() {
    this.status = 'ended';
  }
}

module.exports = Session;