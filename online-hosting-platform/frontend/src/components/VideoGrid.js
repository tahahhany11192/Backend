import React from 'react';

const VideoGrid = ({ streams }) => {
  return (
    <div className="video-container">
      {streams.map((stream, index) => (
        <video key={index} autoPlay playsInline ref={video => {
          if (video) {
            video.srcObject = stream;
          }
        }} />
      ))}
    </div>
  );
};

export default VideoGrid;