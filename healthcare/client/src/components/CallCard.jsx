"use client";
import React, { useState, useEffect } from "react";
import PersonIcon from "@mui/icons-material/Person";
import CallIcon from "@mui/icons-material/Call";
import CallEndIcon from "@mui/icons-material/CallEnd";
import { useSocket } from "../context/SocketProvider";
import { useRouter } from "next/navigation";

const CallCard = () => {
  const { socket, respondToCall } = useSocket(); // Fetch socket and rejectInvitation from the SocketProvider
  const [isShow, setIsShow] = useState(false);
  const [room, setRoom] = useState(null);
  const [sender, setSender] = useState(null);

  const router = useRouter();

  useEffect(() => {
    // Event handler for an incoming call
    const handleNewCall = ({ roomId, senderId }) => {
      setIsShow(true);
      setRoom(roomId);
      setSender(senderId);
    };

    // Attach the event listener
    if (socket) {
      socket.on("send-call", handleNewCall);
    }

    // Cleanup event listener on unmount or when socket changes
    return () => {
      if (socket) {
        socket.off("send-call", handleNewCall);
      }
    };
  }, [socket]);

  // Accept call and navigate to the video call room
  const handleAcceptCall = () => {
    if (room) {
      const link = `/appointment/${room}/call/${room}`;
      resetState();
      router.push(link);
    }
  };

  // Reject call and notify the sender
  const handleRejectCall = () => {
    if (room && sender) {
      respondToCall(room, false ,  sender);
    }
    resetState();
  };

  // Reset all state variables
  const resetState = () => {
    setIsShow(false);
    setRoom(null);
    setSender(null);
  };

  if (!isShow) return null; // Don't render the component if there's no incoming call

  return (
    <div className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 card w-64 h-80 rounded-xl flex flex-col justify-evenly bg-black shadow-2xl cursor-pointer transition-transform duration-200 ease-in-out p-4 text-white hover:rotate-1 hover:scale-105">
      <div className="imgBox w-32 h-32 shadow-lg rounded-full flex justify-center items-center mx-auto">
        <PersonIcon style={{ fontSize: 80 }} />
      </div>
      <div className="name w-full text-center font-extrabold transition-all">
        <p className="p1 text-xl">{sender?.name || "Incoming Call"}</p>
        <p className="p2 text-sm text-blue-400">Incoming Video Call</p>
      </div>
      <div className="caller w-full flex flex-row justify-center space-x-6">
        <button
          onClick={handleAcceptCall}
          className="callerBtn w-12 h-12 rounded-full flex items-center justify-center text-white text-lg cursor-pointer transition-transform duration-100 bg-green-500 shadow-lg hover:scale-110"
        >
          <CallIcon style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={handleRejectCall}
          className="callerBtn w-12 h-12 rounded-full flex items-center justify-center text-white text-lg cursor-pointer transition-transform duration-100 bg-red-500 shadow-lg hover:scale-110"
        >
          <CallEndIcon style={{ fontSize: 24 }} />
        </button>
      </div>
    </div>
  );
};

export default CallCard;
