// components/Call.tsx
import React from 'react';

const Call = ({ caller, onAccept, onReject }) => {
  return (
    <div className="fixed bottom-5 right-5 p-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <p>{caller} is calling...</p>
      <button onClick={onAccept} className="bg-green-500 p-2 rounded mr-2">Accept</button>
      <button onClick={onReject} className="bg-red-500 p-2 rounded">Reject</button>
    </div>
  );
};

export default Call;
