import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "./AuthContext";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { username } = useContext(AuthContext);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!username) return;

    const connectWebSocket = () => {
      wsRef.current = new WebSocket(`wss://autogen.aieducator.com/ws/notifications/${username}/`);

      wsRef.current.onopen = () => {
        console.log("✅ Connected to WebSocket for notifications");
      };

      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Expecting { type: 'homework_notification', notification: {...}, homework: {...} }
          if (msg.type === 'homework_notification') {
            const { notification, homework } = msg;

            const newNotification = {
              // Use DB notification id for mark-as-read endpoint
              id: notification?.id ?? Date.now().toString(),
              title: homework?.title || 'New Homework',
              image: homework?.attachment || '/default-homework-image.jpeg',
              message: notification?.message || 'You have a new homework update.',
              timestamp: notification?.timestamp || homework?.date_assigned || new Date().toISOString(),
              read: false,
              type: 'homework',
              homework,
              // Keep raw notification payload if needed later
              _notification: notification,
            };

            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotification.id);
              return exists ? prev : [newNotification, ...prev];
            });

            setUnreadCount(prev => prev + 1);

            // Show push notification
            Notifications.scheduleNotificationAsync({
              content: {
                title: newNotification.title,
                body: newNotification.message,
                sound: "default",
                data: { notification: newNotification },
              },
              trigger: null,
            });
          } else {
            // Handle other message types if needed
            // console.log("WS message:", msg);
          }
        } catch (err) {
          console.error("❌ Error parsing WebSocket message", err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("❌ WebSocket error", err);
      };

      wsRef.current.onclose = () => {
        console.log("⚠ WebSocket disconnected, trying to reconnect...");
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [username]);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
  };

  // Mark a notification as read (calls WS and REST)
  const markNotificationAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      // Try WS first (optional)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'mark_read', notification_id: id }));
      }
    } catch (_) {
      // Ignore WS errors, fallback to REST below
    }

    try {
      // REST call to backend mark-as-read
      await axiosInstance.post(`/notifications/${id}/read/`);
    } catch (error) {
      console.warn('Could not mark notification as read on server:', error);
      // On failure, revert optimistic update if needed
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  // Clear all notifications: mark all unread as read on server
  const clearAllNotifications = async () => {
    const unread = notifications.filter(n => !n.read);
    // Optimistic UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      // Sequentially or in parallel mark all as read
      await Promise.all(
        unread.map(n =>
          axiosInstance.post(`/notifications/${n.id}/read/`).catch(() => null)
        )
      );
    } catch (error) {
      console.warn('Could not clear notifications on server:', error);
      // Optional: no revert; next WS sync/refresh will correct state
    }
  };

  const getUnreadCount = () =>
    notifications.filter((notif) => !notif.read).length;

  // Predefined notification types for the education app
  const showAchievementNotification = (achievementTitle, description) => {
    const newNotification = {
      id: Date.now().toString(),
      type: "achievement",
      title: "🏆 Achievement Unlocked!",
      message: `${achievementTitle}: ${description}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    Notifications.scheduleNotificationAsync({
      content: {
        title: newNotification.title,
        body: newNotification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  const showStreakNotification = (streakCount) => {
    const newNotification = {
      id: Date.now().toString(),
      type: "streak",
      title: "🔥 Streak Milestone!",
      message: `Congratulations! You've maintained a ${streakCount}-day learning streak!`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    Notifications.scheduleNotificationAsync({
      content: {
        title: newNotification.title,
        body: newNotification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  const showQuestionCompleteNotification = (questionCount) => {
    const newNotification = {
      id: Date.now().toString(),
      type: "progress",
      title: "✅ Great Progress!",
      message: `You've completed ${questionCount} questions today. Keep it up!`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    Notifications.scheduleNotificationAsync({
      content: {
        title: newNotification.title,
        body: newNotification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  const showLevelUpNotification = (newLevel) => {
    const newNotification = {
      id: Date.now().toString(),
      type: "level_up",
      title: "⬆️ Level Up!",
      message: `Amazing! You've reached Level ${newLevel}!`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    Notifications.scheduleNotificationAsync({
      content: {
        title: newNotification.title,
        body: newNotification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  const showHomeworkReminder = (homeworkTitle, dueDate) => {
    const newNotification = {
      id: Date.now().toString(),
      type: "homework",
      title: "📚 Homework Reminder",
      message: `Don't forget: "${homeworkTitle}" is due ${dueDate}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    Notifications.scheduleNotificationAsync({
      content: {
        title: newNotification.title,
        body: newNotification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markNotificationAsRead,
        clearAllNotifications,
        getUnreadCount,
        // Predefined notification helpers
        showAchievementNotification,
        showStreakNotification,
        showQuestionCompleteNotification,
        showLevelUpNotification,
        showHomeworkReminder,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
