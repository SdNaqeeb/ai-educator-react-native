import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const ProgressCard = ({ title, value, icon, progress = 0 }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.8)"]}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#667eea" />
        </View>

        <View style={styles.content}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  content: {
    alignItems: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  progressContainer: {
    width: "100%",
  },
  progressBackground: {
    height: 4,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#667eea",
    borderRadius: 2,
  },
});

export default ProgressCard;
