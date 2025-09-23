import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ProgressDashboardScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={32} color="#667eea" />
        <Text style={styles.headerTitle}>Progress Dashboard</Text>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="bar-chart" size={64} color="#94a3b8" />
        <Text style={styles.placeholderTitle}>Progress Tracking</Text>
        <Text style={styles.placeholderText}>
          Monitor your learning journey, track achievements, and view detailed
          progress reports.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {

    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a202c",
    marginLeft: 12,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default ProgressDashboardScreen;
