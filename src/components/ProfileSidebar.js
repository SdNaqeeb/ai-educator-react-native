import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";

import { AuthContext } from "../contexts/AuthContext";
import { NotificationContext } from "../contexts/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";

const ProfileSidebar = ({ visible, onClose }) => {
  const { username, role, logout } = useContext(AuthContext);
  const { getUnreadCount } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = getUnreadCount();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            onClose();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "notifications",
      title: "Notifications",
      subtitle: `You have ${unreadCount} unread notifications`,
      onPress: () => {
        setShowNotifications(true);
      },
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      icon: "person",
      title: "Profile",
      subtitle: "View and edit profile",
      onPress: () => {
        // TODO: Navigate to profile screen
        Alert.alert("Coming Soon", "Profile screen is under development");
      },
    },
    {
      icon: "settings",
      title: "Settings",
      subtitle: "App preferences",
      onPress: () => {
        // TODO: Navigate to settings screen
        Alert.alert("Coming Soon", "Settings screen is under development");
      },
    },
    {
      icon: "help-circle",
      title: "Help & Support",
      subtitle: "Get help and support",
      onPress: () => {
        // TODO: Navigate to help screen
        Alert.alert("Coming Soon", "Help screen is under development");
      },
    },
    {
      icon: "information-circle",
      title: "About",
      subtitle: "App version and info",
      onPress: () => {
        Alert.alert(
          "AI Educator Mobile",
          "Version 1.0.0\n\nBuilt with ❤️ for better learning",
        );
      },
    },
  ];

  return (
    <>
      <Modal
        isVisible={visible}
        style={styles.modal}
        backdropOpacity={0.5}
        onBackdropPress={onClose}
        animationIn="slideInRight"
        animationOut="slideOutRight"
        useNativeDriverForBackdrop={false}
        hideModalContentWhileAnimating={true}
      >
        <View style={styles.sidebar}>
          {/* Header */}
          <LinearGradient  colors={['#3B82F6', '#8B5CF6']}  style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#ffffff" />
              </View>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.role}>
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </Text>
            </View>
          </LinearGradient>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon} size={24} color="#667eea" />
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
               colors={['#3B82F6', '#8B5CF6']} 
                style={styles.logoutButtonGradient}
              >
                <Ionicons name="log-out" size={20} color="#ffffff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Dropdown */}
      <NotificationDropdown 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  sidebar: {
    backgroundColor: "#ffffff",
    width: 300,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: -4,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  profileSection: {
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "capitalize",
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  logoutContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  logoutButton: {
    borderRadius: 12,
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ProfileSidebar;
