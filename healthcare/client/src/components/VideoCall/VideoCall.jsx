import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Button, IconButton, Avatar, Dialog, DialogActions } from "@mui/material";
import { Mic, Videocam, Chat as ChatIcon, CallEnd, Close, Send } from "@mui/icons-material";
import PrescriptionDialog from "../PrescriptionDialog";
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { useSocket } from "../../context/SocketProvider"; 
import SpeechTranslation from '../Translation';
import { FormControl, Select, MenuItem } from '@mui/material';
import { useRouter } from "next/navigation";




const VideoCall = ({ appointmentId, isDoctor, senderId, recipientId, endTime }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const router = useRouter();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [isRightSideVisible, setIsRightSideVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const { socket: mainSocket, initiateCall } = useSocket();
  const [targetLang, setTargetLang] = useState('en');
  const [remoteTranslation, setRemoteTranslation] = useState('');




  const servers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const createPeerConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    const pc = new RTCPeerConnection(servers);
    peerConnection.current = pc;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      const newRemoteStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => {
        newRemoteStream.addTrack(track);
      });
      setRemoteStream(newRemoteStream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.current?.connected) {
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          roomId: appointmentId,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === "disconnected" || 
          pc.iceConnectionState === "failed") {
        handleDisconnection();
      }
    };

    return pc;
  };

  const handleDisconnection = () => {
    console.log("Handling disconnection...");
    setIsConnected(false);
    if (socket.current?.connected) {
      socket.current.emit("join-room", { roomId: appointmentId });
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  };

  // Initialize media devices
  useEffect(() => {
    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Set up socket connection and WebRTC handlers
  useEffect(() => {
    if (!localStream) return;

    socket.current = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    const initializeConnection = () => {
      createPeerConnection();
      socket.current.emit("join-room", { roomId: appointmentId });
    };

    socket.current.on("connect", () => {
      console.log("Socket connected");
      initializeConnection();
    });

    socket.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.current.on("reconnect", () => {
      console.log("Socket reconnected");
      initializeConnection();
    });

    socket.current.on("room-participants", async (participants) => {
      console.log(`Room participants: ${participants.length}`);
      const isFirst = participants.length === 1;
      setIsInitiator(isFirst);
      
      if (!isFirst && peerConnection.current) {
        try {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.current.emit("offer", {
            sdp: offer,
            roomId: appointmentId,
          });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }else{ 
        initiateCall(recipientId , appointmentId)
      }
    });

    socket.current.on("offer", async ({ sdp }) => {
      console.log("this is offer \n " +JSON.stringify(sdp , null , 2 )) 
      if (!peerConnection.current) return;
      try {
        if (peerConnection.current.signalingState !== "stable") {
          console.log("Ignoring offer in non-stable state");
          return;
        }
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.current.emit("answer", {
          sdp: answer,
          roomId: appointmentId,
        });
        setIsConnected(true);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.current.on("answer", async ({ sdp }) => {
      console.log("this is answer \n " +JSON.stringify(sdp , null , 2 )) 
      if (!peerConnection.current) return;
      
      try {
        if (peerConnection.current.signalingState === "stable") {
          console.log("Ignoring answer in stable state");
          return;
        }
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
        setIsConnected(true);
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socket.current.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current || !peerConnection.current.remoteDescription) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.current.on("new-translation", ({ message }) => {
      console.log("Received translation:", message);
      setRemoteTranslation(message);
      setTimeout(() => {
        setRemoteTranslation('');
      }, 5000);
    });

    socket.current.on("new-message", async ({ message }) => { 
      console.log("Received message:", message);
      handleMessage(message, "Remote");
    });
    mainSocket.on('rejected-call', async({message}) =>{
      alert(message)
    })
    mainSocket.on('rejected' ,async({message})=> {
      router.push(`/appointment/${appointmentId}`)
      alert(message)
    })
    mainSocket.on('call-ended',async({userId , reason})=>{ 
      alert("call ended") ; 
      router.push(`/home`)
    })

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [localStream, appointmentId]);

  // Update remote video when stream changes
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  };


  const handleSendMessage = () => {
    if (message.trim()) {
      handleMessage(message);
      setMessage("");
    }
  };

  const handleMessage = (messageText, sender = "You") => {
    if (messageText.trim()) {
      // Prevent duplicate messages by checking if the message already exists
      setChatMessages(prevMessages => {
        const isDuplicate = prevMessages.some(
          msg => msg.text === messageText && msg.sender === sender
        );
        return isDuplicate 
          ? prevMessages 
          : [...prevMessages, { sender, text: messageText }];
      });

      // If sending from local user, emit to socket
      if (sender === "You" && socket.current) {
        socket.current.emit("message", { 
          message: messageText, 
          roomId: appointmentId 
        });
      }
    }
  };

  const handleOpenPrescriptionDialog = () => {
    setPrescriptionDialogOpen(true);
  };

  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialogOpen(false);
  };

  const handleEndCall = () => {
    setOpenDialog(true);
  };
  const handleSubmitFeedback = () => { 
    mainSocket.emit('end-call',({recipientId}))
    router.push(`/appointment/${appointmentId}`)
  }

  return (
    <div className="relative flex w-full h-screen font-sans overflow-hidden">
      {/* Top Right Icons */}
      <div className="absolute top-4 right-4 z-50 flex space-x-4">
        {isDoctor && (
          <LocalPharmacyIcon 
            className="cursor-pointer w-10 h-10 text-gray-700 hover:text-blue-600 transition-colors"
            onClick={handleOpenPrescriptionDialog} 
          />
        )}
        <ChatIcon
          className="cursor-pointer w-10 h-10 text-gray-700 hover:text-blue-600 transition-colors"
          onClick={() => setIsRightSideVisible(!isRightSideVisible)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex w-full h-[90vh]">
      <div className={`
          flex flex-col flex-1 p-4 
          ${isRightSideVisible 
            ? "md:w-2/3 w-full" 
            : "w-full"
          }`}
        >
        {/* Video Section */}
        <div className={`flex flex-col flex-1"}`}>
          <div className="flex flex-wrap w-full h-full overflow-hidden rounded-lg">
            {/* Local Video */}
            <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
              <div className="absolute top-0 left-0 flex space-x-1 z-10">
                <IconButton className="hover:bg-gray-500 rounded-full">
                  <Mic />
                </IconButton>
                <IconButton className="hover:bg-gray-500 rounded-full">
                  <Videocam />
                </IconButton>
              </div>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white rounded px-2 py-1 text-xs">
                You
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
              <div className="absolute top-0 left-0 flex space-x-1 z-10">
                <IconButton className="hover:bg-gray-500 rounded-full">
                  <Mic />
                </IconButton>
                <IconButton className="hover:bg-gray-500 rounded-full">
                  <Videocam />
                </IconButton>
              </div>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
                <div className="absolute top-4 right-4 z-10">
                <FormControl size="small" className="bg-white rounded">
                  <Select
                    value={targetLang}
                    onChange={(e) => {
                      setTargetLang(e.target.value);
                      socket.current.emit("set-targetLang", {
                        message: e.target.value,
                        roomId: appointmentId
                      });
                    }}
                    className="text-sm"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="zh">Chinese</MenuItem>
                    <MenuItem value="ja">Japanese</MenuItem>
                    <MenuItem value="ko">Korean</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                    <MenuItem value="ru">Russian</MenuItem>
                  </Select>
                </FormControl>
              </div>
              {remoteTranslation && (
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="bg-black bg-opacity-50 p-4 text-white rounded">
                      <div className="text-sm mb-1 text-gray-300">Translated Speech:</div>
                      <div className="text-white">{remoteTranslation}</div>
                    </div>
                  </div>
                )}
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white rounded px-2 py-1 text-xs">
                Remote User
              </div>
            </div>
          </div>
          {socket.current && (
            <SpeechTranslation
            socket={socket.current}
            roomId={appointmentId}
            stream={localStream}
            targetLang={targetLang}
          />
          )}

          {/* Controls */}
          <div className="flex justify-center gap-5 items-center py-4">
            <IconButton className="bg-gray-200 rounded-full p-2">
              <Mic />
            </IconButton>
            <IconButton className="bg-gray-200 rounded-full p-2">
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
        </div>


        {/* Chat Section */}
        {isRightSideVisible && (
          <div className="
            fixed md:static
            top-0 left-0 right-0 bottom-0
            md:w-1/3 
            w-full 
            bg-white 
            shadow-lg 
            border-l 
            z-50
            h-screen 
            md:h-[90vh]
          ">
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xl font-semibold">Chat</h2>
                <IconButton onClick={() => setIsRightSideVisible(false)}>
                  <Close />
                </IconButton>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-2">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex my-2 ${msg.sender === "You" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender !== "You" && (
                      <Avatar
                        src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                        className="rounded-full mr-2 self-end"
                      />
                    )}
                    <div 
                      className={`
                        max-w-[70%] p-2 rounded-lg 
                        ${msg.sender === "You" 
                          ? "bg-blue-500 text-white self-end" 
                          : "bg-gray-200 text-black self-start"}
                      `}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    {msg.sender === "You" && (
                      <Avatar
                        src="https://images.unsplash.com/photo-1581824283135-0666cf353f35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1276&q=80"
                        className="rounded-full ml-2 self-end"
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Message Input */}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full p-2 border rounded-md"
                />
                <IconButton onClick={handleSendMessage} onKeyPress={handleKeyPress} color="primary">
                  <Send />
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isDoctor && (
        <PrescriptionDialog 
          open={prescriptionDialogOpen} 
          onClose={handleClosePrescriptionDialog} 
          appointmentId={appointmentId}
        />
      )}

      {/* Patient Feedback Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">End Call</h3>
          <p className="mb-4">Thank you for using the video call service!</p>
          <textarea 
            placeholder="Leave your feedback..." 
            className="w-full h-24 border p-2 rounded mb-4" 
          />
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary" variant="contained">
              Close
            </Button>
            <Button onClick={handleSubmitFeedback} color="secpndary" variant="contained">
              submit
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </div>
  );
};

export default VideoCall;