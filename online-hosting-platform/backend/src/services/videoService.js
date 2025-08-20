const videoService = {
  initializeStream: async (userId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return { stream, userId };
    } catch (error) {
      console.error('Error initializing video stream:', error);
      throw new Error('Could not initialize video stream');
    }
  },

  startVideoCall: (peer, userId, stream) => {
    const call = peer.call(userId, stream);
    call.on('stream', (remoteStream) => {
      // Handle the remote stream (e.g., display it in the UI)
    });
    call.on('close', () => {
      // Handle call closure (e.g., remove video element)
    });
    return call;
  },

  endVideoCall: (call) => {
    if (call) {
      call.close();
    }
  }
};

export default videoService;