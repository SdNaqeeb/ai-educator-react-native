import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NotificationContext } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const {
    showAchievementNotification,
    showStreakNotification,
    showQuestionCompleteNotification,
    showLevelUpNotification,
    showHomeworkReminder,
    getUnreadCount,
  } = useContext(NotificationContext);

  const unreadCount = getUnreadCount();

  const testNotifications = () => {
    // Test different types of notifications
    showAchievementNotification('Math Master', 'Completed 50 math problems');
    setTimeout(() => {
      showStreakNotification(7);
    }, 1000);
    setTimeout(() => {
      showQuestionCompleteNotification(25);
    }, 2000);
    setTimeout(() => {
      showLevelUpNotification(5);
    }, 3000);
    setTimeout(() => {
      showHomeworkReminder('Algebra Assignment', 'tomorrow');
    }, 4000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      <Text style={styles.subtitle}>Unread: {unreadCount}</Text>
      
      <TouchableOpacity style={styles.button} onPress={testNotifications}>
        <Text style={styles.buttonText}>Test All Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.achievementButton]} 
        onPress={() => showAchievementNotification('Test Achievement', 'This is a test achievement')}
      >
        <Text style={styles.buttonText}>Test Achievement</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.homeworkButton]} 
        onPress={() => showHomeworkReminder('Test Homework', 'in 1 hour')}
      >
        <Text style={styles.buttonText}>Test Homework Reminder</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  achievementButton: {
    backgroundColor: '#f59e0b',
  },
  homeworkButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationTest;
