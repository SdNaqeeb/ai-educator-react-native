import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RecentSessions = () => {
  // Mock data - replace with actual data from API
  const recentSessions = [
    {
      id: 1,
      subject: "Mathematics",
      chapter: "Quadratic Equations",
      questionsCompleted: 5,
      score: 80,
      timeSpent: "15 min",
      date: "2 hours ago",
    },
    {
      id: 2,
      subject: "Mathematics",
      chapter: "Linear Equations",
      questionsCompleted: 8,
      score: 95,
      timeSpent: "22 min",
      date: "1 day ago",
    },
    {
      id: 3,
      subject: "Mathematics",
      chapter: "Probability",
      questionsCompleted: 3,
      score: 60,
      timeSpent: "10 min",
      date: "2 days ago",
    },
  ];

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionSubject}>{item.subject}</Text>
          <Text style={styles.sessionChapter}>{item.chapter}</Text>
        </View>
        <View
          style={[
            styles.scoreContainer,
            {
              backgroundColor:
                item.score >= 80
                  ? "#10b981"
                  : item.score >= 60
                    ? "#f59e0b"
                    : "#ef4444",
            },
          ]}
        >
          <Text style={styles.scoreText}>{item.score}%</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="help-circle" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            {item.questionsCompleted} questions
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.timeSpent}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentSessions.length > 0 ? (
        <FlatList
          data={recentSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>No Recent Sessions</Text>
          <Text style={styles.emptyStateText}>
            Start solving questions to see your recent activity here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
  },
  viewAllText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
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
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    marginBottom: 2,
  },
  sessionChapter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: "center",
  },
  scoreText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  sessionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default RecentSessions;
