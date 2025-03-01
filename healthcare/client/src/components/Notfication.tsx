"use client";

import React, { useState } from "react";
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PrescriptionIcon from "@mui/icons-material/Description";
import AppointmentIcon from "@mui/icons-material/CalendarToday";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedIcon from "@mui/icons-material/Verified";  // Added for VERIFIED
import BlockIcon from "@mui/icons-material/Block";  // Added for VERIFICATION_DECLINED
import { useSocket } from "../context/SocketProvider";
import { useRouter } from 'next/navigation';

// Define notification type icons
const NotificationIcons = {
  PRESCRIPTION_PDF: PrescriptionIcon,
  APPOINTMENT_REMINDER: AppointmentIcon,
  CALL_INVITATION: VideoCallIcon,
  APPOINTMENT_START: VideoCallIcon,
  APPOINTMENT_CONFIRMED: CheckIcon,
  APPOINTMENT_CANCLED: CancelIcon,
  VERIFICATION_DECLINED: BlockIcon,  // Added new type
  VERIFIED: VerifiedIcon,  // Added new type
  DEFAULT: NotificationsIcon,
};

// Define color schemes for different notification types
const NotificationColors = {
  PRESCRIPTION_PDF: "text-blue-600",
  APPOINTMENT_REMINDER: "text-green-600",
  CALL_INVITATION: "text-purple-600",
  APPOINTMENT_START: "text-orange-600",
  APPOINTMENT_CONFIRMED: "text-green-600",
  APPOINTMENT_CANCLED: "text-red-600",
  VERIFICATION_DECLINED: "text-red-600",  // Added new type
  VERIFIED: "text-green-600",  // Added new type
  DEFAULT: "text-gray-600",
};

const Notification = () => {
  const router = useRouter();
  const { 
    notifications: { unread, read }, 
    markNotificationAsRead, 
    clearNotifications 
  } = useSocket();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const notificationOpen = Boolean(notificationAnchorEl);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationNavigation = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
  
    console.log("Notification Type:", notification.type);
    console.log("Full Notification Object:", JSON.stringify(notification, null, 2));
  
    handleNotificationClose();
  
    switch(notification.type) {
      case 'PRESCRIPTION_PDF':
        const prescriptionId = 
          notification.data?.prescriptionId || 
          notification.data?.prescription_id || 
          notification.prescription_id;
        
        if (prescriptionId) {
          router.push(`/prescription/${prescriptionId}`);
        } else {
          console.error('No prescription ID found in notification');
        }
        break;
      case 'CALL_INVITATION':
        const appointmentId = 
          notification.data?.appointmentId || 
          notification.data?.appointment_id || 
          notification.appointmentId;
        
        if (appointmentId) {
          router.push(`/appointment/${appointmentId}/call/${appointmentId}`);
        }
        break;
      case 'APPOINTMENT_REMINDER':
      case 'APPOINTMENT_CONFIRMED':
        const reminderAppointmentId = 
          notification.data?.appointmentId || 
          notification.data?.appointment_id || 
          notification.appointmentId;
        
        if (reminderAppointmentId) {
          router.push(`/appointment/${reminderAppointmentId}`);
        }
        break;
      case 'APPOINTMENT_CANCLED':
        router.push('/user/scheduling');
        break;
      case 'VERIFICATION_DECLINED':
        const verificationId = 
          notification.data?.verification_id || 
          notification.verification_id || 
          null;
        
        if (verificationId) {
          router.push(`/verification/update/${verificationId}`);
        } else {
          console.error('No verification ID found in notification');
        }
        break;
      case 'VERIFIED':
        // Do nothing for VERIFIED notifications
        break;
      default:
        console.log('Unhandled notification type:', notification.type);
        break;
    }
  };

  const handleNotificationRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleClearAllNotifications = () => {
    clearNotifications();
    handleNotificationClose();
  };

  const renderNotificationIcon = (type: string) => {
    const Icon = NotificationIcons[type] || NotificationIcons.DEFAULT;
    const colorClass = NotificationColors[type] || NotificationColors.DEFAULT;
    return <Icon className={`mr-2 ${colorClass}`} />;
  };

  const formatNotificationTime = (createdAt: Date) => {
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffMinutes = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 60000
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hr ago`;
    return notificationDate.toLocaleDateString();
  };

  const allNotifications = [...unread, ...read];

  return (
    <div className="hidden sm:flex items-center space-x-2">
      <IconButton onClick={handleNotificationClick}>
        <Badge badgeContent={unread.length} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        anchorEl={notificationAnchorEl}
        open={notificationOpen}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box
          sx={{
            width: 350,
            maxHeight: 500,
            overflowY: "auto",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Notifications
            </Typography>
            {allNotifications.length > 0 && (
              <Button
                size="small"
                color="secondary"
                onClick={handleClearAllNotifications}
              >
                Clear All
              </Button>
            )}
          </Box>

          <List>
            {allNotifications.length > 0 ? (
              allNotifications.map((notification) => (
                <ListItem
                  key={notification._id}
                  onClick={() => handleNotificationNavigation(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? "white" : "#f5f5f5",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                    cursor: "pointer",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {renderNotificationIcon(notification.type)}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold" }}
                      >
                        {notification.title || "Notification"}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatNotificationTime(notification.createdAt || new Date())}
                      </Typography>
                    </Box>
                    {!notification.isRead && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "primary.main",
                        }}
                      />
                    )}
                  </Box>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="No new notifications"
                  sx={{ textAlign: "center" }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>
    </div>
  );
};

export default Notification;