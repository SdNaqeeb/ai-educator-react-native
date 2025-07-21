import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuickActions = ({ navigation }) => {
  const quickActions = [
    {
      icon: "trending-up",
      title: "Progress",
      subtitle: "View Analytics",
      color: "#10b981",
      onPress: () => navigation.navigate("Progress"),
    },
    {
      icon: "trophy",
      title: "Leaderboard",
      subtitle: "See Rankings",
      color: "#f59e0b",
      onPress: () => navigation.navigate("Leaderboard"),
    },
    {
      icon: "medal",
      title: "Quests",
      subtitle: "Complete Tasks",
      color: "#8b5cf6",
      onPress: () => navigation.navigate("Quests"),
    },
    {
      icon: "bar-chart",
      title: "Analytics",
      subtitle: "View Analytics",
      color: "#ef4444",
      onPress: () => navigation.navigate("Analytics"),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: action.color }]}
            >
              <Ionicons name={action.icon} size={24} color="#ffffff" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});

export default QuickActions;
