"use client"
import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback 
} from 'react';
import io, { Socket } from 'socket.io-client';
import axiosInstance from '../apicalls/axiosInstance';
import { useAuthContext } from '../hooks/useAuthContext';

// Interfaces
interface Notification {
  _id: string;  
  user: string;
  type: string;
  title?: string;
  message: string;
  isRead?: boolean;
  createdAt?: Date;
  prescription_id?: string;
  appointmentId?: string;
  verification_id?: string ; 
  data?: {
    appointmentId?: string;
    pdfUrl?: string;
    callRoomId?: string;
    appointmentTime?: string;
    prescriptionId?: string;
    verification_id?: string ; 
    additionalDetails?: any;
  };
}




interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: {
    unread: Notification[];
    read: Notification[];
  };
  initiateCall: (recipientId: string, roomId: string) => void;
  respondToCall: (roomId: string, accepted: boolean, sender: string) => void;
  joinRoom: (roomId: string) => void;
  sendFeedback: (roomId: string, feedback: string, rating?: number, doctorId?: string) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<{
    unread: Notification[];
    read: Notification[];
  }>({
    unread: [],
    read: []
  });

  const initiateCall = useCallback((recipientId: string, roomId: string) => {
    if (socket && user?._id) {
      socket.emit('send-call', {
        roomId,
        receivedId: recipientId,
        senderId: user._id
      });
    } else {
      console.warn('Cannot initiate call: Socket or user not available');
    }
  }, [socket, user]);

  const respondToCall = useCallback((roomId: string, accepted: boolean, sender: string) => {
    if (socket && user?._id) {
      if (accepted) {
        return
      } else {
        socket.emit('rejected', {
          roomId,
          decliner: user._id,
          caller: sender
        });
      }
    } else {
      console.warn('Cannot respond to call: Socket or incoming call details not available');
    }
  }, [socket, user]);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && user?._id) {
      socket.emit('join-room', { roomId, userId: user._id });
    }
  }, [socket, user]);
    
  const sendFeedback = useCallback((roomId: string, feedback: string, doctorId?: string) => {
    if (socket && user?._id) {
      socket.emit('call-feedback', { 
        roomId, 
        userId: user._id,
        feedback, 
        doctorId
      });
    } else {
      console.warn('Cannot send feedback: Socket or user not available');
    }
  }, [socket, user]);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await axiosInstance.get(`/notifications/${user._id}`);

      setNotifications({
        unread: response.data.unread.map((notif: Notification) => ({
          ...notif,
          createdAt: new Date(notif.createdAt || Date.now())
        })),
        read: response.data.read.map((notif: Notification) => ({
          ...notif,
          createdAt: new Date(notif.createdAt || Date.now())
        }))
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
  
      setNotifications(prev => {
        const notificationToMove = prev.unread.find(n => n._id === notificationId);
        
        if (!notificationToMove) return prev;
  
        return {
          unread: prev.unread.filter(n => n._id !== notificationId),
          read: [
            { ...notificationToMove, isRead: true },
            ...prev.read
          ]
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    if (!user?._id) return;

    try {
      await axiosInstance.delete(`/notifications/${user._id}`);
      setNotifications({ unread: [], read: [] });
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token && user?._id) {
      const newSocket = io('http://localhost:8000', {
        auth: { token: user.token },
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000
      });

      const handleConnect = () => {
        setIsConnected(true);
        newSocket.emit('register-user', { 
          userId: user._id, 
          deviceToken: user.token
        });
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleNotification = (notification: Notification) => {
        const processedNotification = {
          ...notification,
          data: {
            ...notification.data,
            prescriptionId:
              notification?.data?.prescription_id ||
              notification?.data?.prescriptionId ||
              notification.prescription_id || 
              null,
            verification_id : notification?.data?.verification_id || notification?.verification_id || null , 
            appointmentId: notification?.data?.appointmentId || null,
          },
          createdAt: new Date(),
          isRead: false,
        };
      
        setNotifications((prev) => ({
          unread: [processedNotification, ...prev.unread], 
          read: prev.read, 
        }));
      };

      newSocket.on('connect', handleConnect);
      newSocket.on('disconnect', handleDisconnect);
      newSocket.on('notification', handleNotification);

      setSocket(newSocket);
      fetchNotifications();

      return () => {
        newSocket.off('connect', handleConnect);
        newSocket.off('disconnect', handleDisconnect);
        newSocket.off('notification', handleNotification);
        newSocket.disconnect();
      };
    }
  }, [user, fetchNotifications]);

  const contextValue: SocketContextType = {
    socket, 
    isConnected, 
    notifications,
    initiateCall,
    respondToCall,
    joinRoom,
    sendFeedback,
    markNotificationAsRead,
    clearNotifications,
    fetchNotifications
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};