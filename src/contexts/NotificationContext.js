import React, { createContext, useState, useContext, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

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

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Show local notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        sound: "default",
      },
      trigger: null,
    });
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const notification = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Predefined notification types for the education app
  const showAchievementNotification = (achievementTitle, description) => {
    addNotification({
      type: "achievement",
      title: "🏆 Achievement Unlocked!",
      message: `${achievementTitle}: ${description}`,
      icon: "trophy",
      priority: "high",
    });
  };

  const showStreakNotification = (streakCount) => {
    addNotification({
      type: "streak",
      title: "🔥 Streak Milestone!",
      message: `Congratulations! You've maintained a ${streakCount}-day learning streak!`,
      icon: "flame",
      priority: "medium",
    });
  };

  const showQuestionCompleteNotification = (questionCount) => {
    addNotification({
      type: "progress",
      title: "✅ Great Progress!",
      message: `You've completed ${questionCount} questions today. Keep it up!`,
      icon: "checkmark-circle",
      priority: "low",
    });
  };

  const showLevelUpNotification = (newLevel) => {
    addNotification({
      type: "level_up",
      title: "⬆️ Level Up!",
      message: `Amazing! You've reached Level ${newLevel}!`,
      icon: "trending-up",
      priority: "high",
    });
  };

  const showHomeworkReminder = (homeworkTitle, dueDate) => {
    addNotification({
      type: "homework",
      title: "📚 Homework Reminder",
      message: `Don't forget: "${homeworkTitle}" is due ${dueDate}`,
      icon: "book",
      priority: "medium",
    });
  };

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    // Predefined notification helpers
    showAchievementNotification,
    showStreakNotification,
    showQuestionCompleteNotification,
    showLevelUpNotification,
    showHomeworkReminder,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
