import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';

const StudentSession = () => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000'); // Adjust the URL as needed

    // Join the session
    const sessionId = 'your-session-id'; // Replace with actual session ID
    socketRef.current.emit('join-session', sessionId);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Live Session</h1>
      <VideoGrid />
      <Controls />
    </div>
  );
};

export default StudentSession;