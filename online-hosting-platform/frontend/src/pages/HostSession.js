import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';

const HostSession = () => {
  const [roomId, setRoomId] = useState('default-room');
  const [userId, setUserId] = useState(`user-${Date.now()}`);
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const [peers, setPeers] = useState({});

  useEffect(() => {
    socketRef.current = io();
    peerRef.current = new Peer(userId);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        socketRef.current.emit('join-room', { roomId, userId });
      });

    peerRef.current.on('call', call => {
      call.answer(localStreamRef.current);
      call.on('stream', userVideoStream => {
        setPeers(prevPeers => ({
          ...prevPeers,
          [call.peer]: userVideoStream
        }));
      });
    });

    socketRef.current.on('user-connected', userId => {
      const call = peerRef.current.call(userId, localStreamRef.current);
      call.on('stream', userVideoStream => {
        setPeers(prevPeers => ({
          ...prevPeers,
          [userId]: userVideoStream
        }));
      });
    });

    socketRef.current.on('user-disconnected', userId => {
      setPeers(prevPeers => {
        const updatedPeers = { ...prevPeers };
        delete updatedPeers[userId];
        return updatedPeers;
      });
    });

    return () => {
      socketRef.current.disconnect();
      peerRef.current.destroy();
    };
  }, [roomId, userId]);

  const endSession = () => {
    socketRef.current.disconnect();
    peerRef.current.destroy();
  };

  return (
    <div>
      <h1>Host Live Session</h1>
      <VideoGrid peers={peers} localStream={localStreamRef.current} />
      <Controls endSession={endSession} />
    </div>
  );
};

export default HostSession;