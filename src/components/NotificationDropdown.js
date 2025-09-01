import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';

const NotificationDropdown = ({ visible, onClose }) => {
  const {
    notifications = [],
    markNotificationAsRead,
    clearAllNotifications,
    getUnreadCount,
  } = useContext(NotificationContext);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const unreadCount = getUnreadCount();

  const getNotificationIcon = (type) => {
    const iconMap = {
      achievement: '🏆',
      progress: '📈',
      recommendation: '💡',
      reminder: '⏰',
      homework: '📖',
      streak: '🔥',
      level_up: '⬆️',
    };
    return iconMap[type] || '🔔';
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);
    
    // Mark notification as read
    markNotificationAsRead(notification.id);
    
    // If it's a homework notification with homework details, redirect to homework page
    if (notification.type === 'homework' && notification.homework) {
      console.log("Navigating to homework submission with details:", notification.homework);
      
      navigation.navigate('Homework', {
        homeworkCode: notification.homework.homework_code,
        homeworkDetails: notification.homework,
        homeworkImages: notification.homework.images || [],
      });
      onClose();
    } else {
      // For other notifications, show the modal
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to mark all notifications as read?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearAllNotifications();
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateTitle}>No notifications</Text>
                  <Text style={styles.emptyStateText}>
                    You're all caught up! New notifications will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification,
                    ]}
                    onPress={() => handleNotificationClick(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      <Text style={styles.iconText}>
                        {getNotificationIcon(notification.type)}
                      </Text>
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        notification.read && styles.readNotificationTitle
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={[
                        styles.notificationMessage,
                        notification.read && styles.readNotificationMessage
                      ]}>
                        {notification.message}
                      </Text>
                      <Text style={[
                        styles.notificationTime,
                        notification.read && styles.readNotificationTime
                      ]}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </View>

                    {!notification.read && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal for showing non-homework notification details */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {selectedNotification?.title || 'Notification Details'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.detailCloseButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailBody}>
              <Text style={styles.detailMessage}>
                {selectedNotification?.message}
              </Text>
              <Text style={styles.detailTime}>
                {selectedNotification?.timestamp
                  ? new Date(selectedNotification.timestamp).toLocaleString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 15,
  },
  clearButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  unreadNotification: {
    backgroundColor: '#fef3c7',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  readNotificationTitle: {
    color: '#6b7280',
    fontWeight: '400',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },
  readNotificationMessage: {
    color: '#9ca3af',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  readNotificationTime: {
    color: '#9ca3af',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    alignSelf: 'center',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  detailCloseButton: {
    padding: 5,
  },
  detailBody: {
    padding: 20,
  },
  detailMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailTime: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default NotificationDropdown;
