import React from 'react';

const Controls = ({ onMute, onToggleCamera, onEndSession }) => {
  return (
    <div className="controls">
      <button onClick={onMute}>Mute</button>
      <button onClick={onToggleCamera}>Toggle Camera</button>
      <button onClick={onEndSession}>End Session</button>
    </div>
  );
};

export default Controls;