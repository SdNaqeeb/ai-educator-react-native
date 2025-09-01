import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axiosInstance";
import SessionDetails from "./SessionDetails";




const RecentSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchRecentSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/sessiondata/");
      // console.log("All sessions response:", response.data);
      if (
        response?.data?.status === "success" &&
        Array.isArray(response?.data?.sessions)
      ) {
        const allGapData = response.data.sessions.flatMap((session) => {
          try {
            const parsed =
              typeof session.session_data === "string"
                ? JSON.parse(session.session_data)
                : session.session_data;
            return parsed?.gap_analysis_data || [];
          } catch (e) {
            return [];
          }
        });
        setSessions(allGapData);
      } else {
        setError("Unexpected response format");
      }
    } catch (e) {
      setError("Failed to fetch session data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSessions();
  }, [fetchRecentSessions]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(sessions.map((s) => s.subject).filter(Boolean));
    return Array.from(subjects);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (activeTab === "all") return sessions;
    return sessions.filter((s) => s.subject === activeTab);
  }, [sessions, activeTab]);

  const getSessionColor = (subject) => {
    if (subject && subject.toLowerCase().includes("math")) return "#34A853";
    if (subject && (subject.toLowerCase().includes("code") || subject.toLowerCase().includes("computer"))) return "#4285F4";
    if (subject && subject.toLowerCase().includes("physics")) return "#FBBC05";
    if (subject && subject.toLowerCase().includes("chemistry")) return "#EA4335";
    if (subject && subject.toLowerCase().includes("biology")) return "#8E44AD";
    return "#00C1D4";
  };

  const getSessionTitle = (session) => {
    if (session?.subject) {
      const title = `${session.subject} - ${session.answering_type === "correct" ? "Exercise" : "Solved Examples"}`;
      return title.length > 25 ? title.substring(0, 22) + "..." : title;
    }
    return "Session";
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      if (diffSec < 60) return `${diffSec} sec ago`;
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHour < 24) return `${diffHour} hr ago`;
      return `${diffDay} day ago`;
    } catch (e) {
      return "recently";
    }
  };

  const onPressSession = (session) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity style={[styles.sessionCard, { borderLeftColor: getSessionColor(item.subject), borderLeftWidth: 4 }]} onPress={() => onPressSession(item)}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionSubject, { color: getSessionColor(item.subject) }]}>{item.subject}</Text>
          <Text style={styles.sessionChapter}>{getSessionTitle(item)}</Text>
        </View>
        <View
          style={[
            styles.scoreContainer,
            {
              backgroundColor:
                (item.student_score ?? 0) >= 80
                  ? "#10b981"
                  : (item.student_score ?? 0) >= 60
                    ? "#f59e0b"
                    : "#ef4444",
            },
          ]}
        >
          <Text style={styles.scoreText}>{item.student_score ?? 0}%</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Ionicons name="help-circle" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            {item.questions_completed ?? 0} questions
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.time_spent || ""}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.statText}>{formatTimeAgo(item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {Boolean(sessions?.length) && (
          <TouchableOpacity onPress={() => setActiveTab("all")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={24} color="#ef4444" />
          <Text style={[styles.emptyStateTitle, { color: "#ef4444" }]}>Failed to load</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity onPress={fetchRecentSessions} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sessions.length > 0 ? (
        <>
          {uniqueSubjects.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
            >
              <TouchableOpacity
                onPress={() => setActiveTab("all")}
                style={[styles.tab, activeTab === "all" && styles.activeTab]}
              >
                <Ionicons name="time-outline" size={16} color={activeTab === "all" ? "#ffffff" : "#334155"} />
                <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All ({sessions.length})</Text>
              </TouchableOpacity>
              {uniqueSubjects.map((subj) => (
                <TouchableOpacity
                  key={subj}
                  onPress={() => setActiveTab(subj)}
                  style={[styles.tab, activeTab === subj && styles.activeTab]}
                >
                  <Ionicons name="book" size={16} color={activeTab === subj ? "#ffffff" : "#334155"} />
                  <Text style={[styles.tabText, activeTab === subj && styles.activeTabText]}>
                    {subj} ({sessions.filter((s) => s.subject === subj).length})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {filteredSessions.length > 0 ? (
            <FlatList
              data={filteredSessions}
              renderItem={renderSessionItem}
              keyExtractor={(_, index) => String(index)}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyStateTitle}>No sessions for this filter</Text>
              <Text style={styles.emptyStateText}>Try another category.</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>No Recent Sessions</Text>
          <Text style={styles.emptyStateText}>
            Start solving questions to see your recent activity here
          </Text>
        </View>
      )}

      <SessionDetails
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        session={selectedSession}
      />
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
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
  tabsContainer: {
    paddingBottom: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: "#667eea",
  },
  tabText: {
    marginLeft: 6,
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#ffffff",
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
  retryButton: {
    marginTop: 12,
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default RecentSessions;
