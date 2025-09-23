import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuestsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medal" size={32} color="#667eea" />
        <Text style={styles.headerTitle}>Quests & Challenges</Text>
      </View>

      <View style={styles.placeholder}>
        <Ionicons name="flag" size={64} color="#94a3b8" />
        <Text style={styles.placeholderTitle}>Learning Quests</Text>
        <Text style={styles.placeholderText}>
          Complete daily challenges, unlock achievements, and earn rewards for
          your progress.
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

export default QuestsScreen;
