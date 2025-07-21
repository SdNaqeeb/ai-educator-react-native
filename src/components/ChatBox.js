import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../contexts/AuthContext";
import ChatInterface from "./ChatInterface";

const { width, height } = Dimensions.get("window");

const ChatBox = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  // Don't show chat on auth screens
  if (!user) {
    return null;
  }

  const toggleChat = () => {
    setIsVisible(!isVisible);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsVisible(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isVisible && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            {
              bottom: Platform.OS === "ios" ? insets.bottom + 80 : 80,
              right: 20,
            },
          ]}
          onPress={toggleChat}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.floatingButtonGradient}
          >
            <Ionicons name="chatbubble" size={24} color="#ffffff" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>AI</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal
        isVisible={isVisible}
        style={styles.modal}
        backdropOpacity={0.3}
        onBackdropPress={closeChat}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
      >
        <View
          style={[
            styles.chatContainer,
            {
              height: isMinimized ? 60 : height * 0.7,
              marginBottom: Platform.OS === "ios" ? insets.bottom : 0,
            },
          ]}
        >
          {/* Chat Header */}
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.chatHeader}
          >
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.chatTitle}>AI Assistant</Text>
                <Text style={styles.chatStatus}>Online • Ready to help</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {!isMinimized && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={minimizeChat}
                >
                  <Ionicons name="remove" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}

              {isMinimized && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={maximizeChat}
                >
                  <Ionicons name="chevron-up" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.headerButton} onPress={closeChat}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Chat Content */}
          {!isMinimized && (
            <View style={styles.chatContent}>
              <ChatInterface />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    width: 56,
    height: 56,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  notificationText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  chatContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  chatTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  chatStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  chatContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
});

export default ChatBox;
