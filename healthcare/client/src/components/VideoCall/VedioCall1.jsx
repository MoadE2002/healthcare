"use client"
import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, Dialog, DialogActions } from "@mui/material";
import { Mic, Videocam, CallEnd } from "@mui/icons-material";
import { useSocket } from '../../context/SocketProvider';
import { useAuthContext } from '../../hooks/useAuthContext';

const VideoCall = ({ 
  isDoctor, 
  senderId, 
  recipientId, 
  endTime, 
  appointmentId 
}) => {
  const { 
    socket, 
    initiateCall, 
    joinRoom, 
    endCall,
    leaveRoom,
    sendFeedback,
    sendOffer 
  } = useSocket();
  const { user } = useAuthContext();
  
  // Refs for video elements and WebRTC
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const pendingCandidates = useRef([]);

  
  // State management
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState(0);
  const [hasInitiatedCall, setHasInitiatedCall] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  const [callStarted, setCallStarted] = useState(false);

  // WebRTC configuration
  const servers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (roomParticipants < 2) {
      setConnectionStatus('Waiting for participant...');
    } else {
      setConnectionStatus('connected');
    }
  }, [roomParticipants]);

  // Timer effect to track call duration
  useEffect(() => {
    let intervalId;
    
    if (callStarted) {
      intervalId = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [callStarted]);

  const cleanupCall = () => {
    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Leave the room
    leaveRoom(appointmentId);
  };

  // Create peer connection
  const createPeerConnection = () => {
    // Close existing connection if it exists
    if (peerConnection.current) {
      try {
        peerConnection.current.close();
      } catch (error) {
        console.warn("Error closing existing peer connection:", error);
      }
    }

    const pc = new RTCPeerConnection(servers);
    peerConnection.current = pc;

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log("Remote track received:", event);
      console.log("Remote stream tracks:", event.streams[0].getTracks());
      
      try {
        const newRemoteStream = new MediaStream();
        event.streams[0].getTracks().forEach((track) => {
          console.log("Adding track:", track.kind);
          newRemoteStream.addTrack(track);
        });
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = newRemoteStream;
          console.log("Remote video source set:", remoteVideoRef.current.srcObject);
          
          // Add event listeners for video element
          remoteVideoRef.current.onloadedmetadata = () => {
            console.log("Remote video metadata loaded");
            remoteVideoRef.current?.play().catch(e => {
              console.error("Error playing remote video:", e);
            });
          };
          
          remoteVideoRef.current.onerror = (e) => {
            console.error("Remote video error:", e);
          };
        }
        
        setRemoteStream(newRemoteStream);
        setConnectionStatus('Connected');
        
        // Mark call as started when remote stream is received
        if (!callStarted) {
          setCallStarted(true);
        }
      } catch (error) {
        console.error("Error processing remote stream:", error);
        setConnectionStatus('Stream Error');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          roomId: appointmentId,
          userId: user?._id
        });
      }
    };

    // Connection state management
    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      switch(pc.iceConnectionState) {
        case 'checking':
          setConnectionStatus('Connecting...');
          break;
        case 'connected':
          setConnectionStatus('Connected');
          break;
        case 'disconnected':
        case 'failed':
          console.error("WebRTC connection failed or disconnected");
          setConnectionStatus('Disconnected');
          handleCallDisconnection();
          break;
        case 'closed':
          console.error("WebRTC connection closed");
          handleCallDisconnection();
          break;
      }
    };

    return pc;
  };

  // Initialize media devices
  const initializeMedia = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Check stream tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log(`Video Tracks: ${videoTracks.length}, Audio Tracks: ${audioTracks.length}`);
      
      setLocalStream(stream);
    
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    
      return stream;
    } catch (error) {
      console.error("Detailed Media Access Error:", error);
      // Provide user-friendly error handling
      setConnectionStatus('Media Access Error');
      return null;
    }
  };

  // WebRTC signaling and socket setup
  useEffect(() => {
    if (!socket || !user) return;

    // Join room
    joinRoom(appointmentId);

    // Socket event handlers
    const handleRoomParticipants = (participants) => {
      console.log("Room participants:", participants);
      setRoomParticipants(participants.length);
    };

    const handelsenoffer = async() =>  { 
      try {
        const pc = createPeerConnection();
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        await pc.setLocalDescription(offer);
    
        socket.emit("offer", {
          sdp: offer,
          roomId: appointmentId,
          userId: user._id
        });
        setHasInitiatedCall(true);
      } catch (error) {
        console.error("Error creating and sending offer:", error);
      }
    };

    const handlInitiate = async() =>{ 
      initiateCall(recipientId , appointmentId)
    }

    const handleRoomLeft = (data) => {
      console.log("User left room:", data);
      setRoomParticipants(data.participants);

      // Only show feedback dialog if call has actually started and lasted more than a few seconds
      if (data.participants < 2 && callStarted && callDuration > 3) {
        handleCallDisconnection();
      }
    };

    const handleOffer = async ({ sdp, userId }) => {
      try {
        console.log("Received offer SDP: \n", JSON.stringify(sdp, null, 2));

        const pc = peerConnection.current || createPeerConnection();
        
        // More robust signaling state check
        if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
          console.warn(`Unexpected signaling state: ${pc.signalingState}. Recreating peer connection.`);
          peerConnection.current = createPeerConnection();
        }
    
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        const stream = await initializeMedia();
        if (!stream) {
          console.error("Failed to initialize media stream");
          return;
        }
    
        const answerOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        };
    
        const answer = await pc.createAnswer(answerOptions);
        await pc.setLocalDescription(answer);
    
        socket.emit("answer", {
          sdp: answer,
          roomId: appointmentId,
          userId: user._id
        });
      } catch (error) {
        console.error("Detailed Offer Handling Error:", error);
        // Recreate peer connection on critical errors
        peerConnection.current = createPeerConnection();
      }
    };

    const handleAnswer = async ({ sdp, userId, roomId }) => {
      try {
        console.log("Received answer SDP: \n", JSON.stringify(sdp, null, 2));
        
        const pc = peerConnection.current;
        if (!pc) {
          console.warn("Peer connection is not initialized");
          return;
        }
    
        // Check if the peer connection is in a state where we can set the remote description
        if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          // Attempt to add any pending candidates after setting remote description
          while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            if (candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (candidateError) {
                console.error("Error adding queued ICE candidate:", candidateError);
              }
            }
          }
        } else {
          console.warn(`Cannot set remote description. Current signaling state: ${pc.signalingState}`);
        }
      } catch (error) {
        console.error("Error handling answer:", error);
        
        // Additional error handling
        if (error instanceof Error) {
          if (error.name === 'InvalidStateError') {
            // Recreate peer connection if in an invalid state
            console.warn("Invalid state. Recreating peer connection.");
            createPeerConnection();
          }
        }
      }
    };

    const handleIceCandidate = async ({ candidate, userId, roomId }) => {
      try {
        const pc = peerConnection.current;
        if (pc) {
          if (pc.remoteDescription) {
            // If remote description is set, add the candidate immediately
            if (candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
    
            // Also add any pending candidates
            while (pendingCandidates.current.length > 0) {
              const pendingCandidate = pendingCandidates.current.shift();
              if (pendingCandidate) {
                await pc.addIceCandidate(new RTCIceCandidate(pendingCandidate));
              }
            }
          } else {
            // If remote description is not set, store the candidate
            if (candidate) {
              console.log("Queueing ICE candidate");
              pendingCandidates.current.push(candidate);
            }
          }
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    };

    // Add socket listeners
    socket.on("room-participants", handleRoomParticipants);
    socket.on("room-left", handleRoomLeft);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("can-offre", handelsenoffer);
    socket.on("can-initiate",handlInitiate); 

    // Media initialization
    initializeMedia();

    // Cleanup
    return () => {
      socket.off("room-participants", handleRoomParticipants);
      socket.off("room-left", handleRoomLeft);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("can-offre", handelsenoffer);
      socket.off("can-initiate",handlInitiate)


      // Cleanup call resources
      cleanupCall();
    };
  }, [socket, user]);

  // Call management handlers
  const handleCallDisconnection = () => {
    endCall(appointmentId, "Disconnected");
    cleanupCall();
    setOpenFeedbackDialog(true);
  };

  const handleEndCall = () => {
    endCall(appointmentId, "User ended call");
    cleanupCall();
    setOpenFeedbackDialog(true);
  };

  // Media control handlers
  const handleMicToggle = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const handleCameraToggle = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
      initializeMedia();
    }
  };

  // Feedback submission
  const handleFeedbackSubmit = () => {
    const feedbackTextarea = document.querySelector('textarea[placeholder="Leave your feedback..."]');
    const feedback = feedbackTextarea ? feedbackTextarea.value : '';

    sendFeedback(
      appointmentId, 
      feedback, 
      undefined,
      isDoctor ? user?._id : recipientId 
    );
    setOpenFeedbackDialog(false);
  };

  return (
    <div className="relative flex w-full h-full min-h-screen font-sans">
      <div className="flex flex-col flex-1 p-8">
        <div className="flex flex-wrap w-full overflow-hidden rounded-lg">
          <div className="relative z-50 w-full md:w-1/2 h-[35vh] md:h-[75vh]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
           
          </div>

          <div className="relative z-50 w-full md:w-1/2 h-[35vh] md:h-[75vh]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
           
          </div>
        </div>

        <div className="flex justify-center gap-5 items-center py-8">
          <IconButton 
            onClick={handleMicToggle} 
            className={`bg-gray-200 rounded-full p-2 ${isMicMuted ? 'bg-red-200' : ''}`}
          >
            <Mic />
          </IconButton>
          <IconButton 
            onClick={handleCameraToggle} 
            className={`bg-gray-200 rounded-full p-2 ${isCameraOff ? 'bg-red-200' : ''}`}
          >
            <Videocam />
          </IconButton>
          <Button
            className="flex items-center justify-center bg-red-600 text-white rounded-full p-2"
            variant="contained"
            onClick={handleEndCall}
          >
            <CallEnd />
          </Button>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={openFeedbackDialog} onClose={() => setOpenFeedbackDialog(false)}>
        <div className="p-4">
          <h3 className="text-xl font-semibold">Call Ended</h3>
          <p>How was your video call experience?</p>
          <textarea 
            placeholder="Leave your feedback..." 
            className="w-full h-24 border p-2 rounded mt-2" 
          />
          <DialogActions>
            <Button onClick={handleFeedbackSubmit} color="primary">
              Submit
            </Button>
            <Button onClick={() => setOpenFeedbackDialog(false)} color="secondary">
              Close
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </div>
  );
};

export default VideoCall;