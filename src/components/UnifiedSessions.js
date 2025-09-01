import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../api/axiosInstance";
import SessionDetails from "./SessionDetails";
import HomeworkDetailsModal from "./HomeworkDetailsModal";

const UnifiedSessions = () => {
  const [activeTab, setActiveTab] = useState("self");

  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState([]);
  const [classworkSubmissions, setClassworkSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  const fetchRecentSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setError(null);
      const response = await axiosInstance.get("/sessiondata/");
      if (response?.data?.status === "success" && Array.isArray(response?.data?.sessions)) {
        const allGapData = response.data.sessions.flatMap((session) => {
          try {
            const parsed = typeof session.session_data === "string" ? JSON.parse(session.session_data) : session.session_data;
            return parsed?.gap_analysis_data || [];
          } catch {
            return [];
          }
        });
        setRecentSessions(allGapData);
      } else {
        setRecentSessions([]);
      }
    } catch (e) {
      setError("Failed to fetch session data");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchHomeworkSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true);
      setError(null);
      const response = await axiosInstance.get("/homework-submission/");
      const submissionsArray = Array.isArray(response?.data) ? response.data : [];
      const processed = submissionsArray.map((item) => {
        if (!item.feedback) {
          return {
            submission_id: item.id,
            submission_date: item.submission_date,
            submitted_file: item.submitted_file,
            homework: item.homework,
            score: item.score,
            student: item.student,
            result_json: item.result_json,
            worksheet_id: item.homework || `HW-${item.id}`,
            total_score: item.score || 0,
            max_total_score: item.max_possible_socre,
            overall_percentage: item.score || 0,
            grade: item.score >= 80 ? "A" : item.score >= 60 ? "B" : "C",
            board: "N/A",
            class: "N/A",
            questions_attempted: 0,
            total_questions: 0,
            homework_type: item.homework_type || "homework",
          };
        }
        try {
          const parsed = JSON.parse(item.feedback);
          return {
            ...parsed,
            submission_id: item.id,
            submission_date: item.submission_date || parsed.submission_timestamp,
            submitted_file: item.submitted_file,
            homework: item.homework,
            homework_type: item.homework_type || "homework",
          };
        } catch {
          return {
            submission_id: item.id,
            submission_date: item.submission_date,
            submitted_file: item.submitted_file,
            homework: item.homework,
            score: item.score,
            worksheet_id: item.homework || `HW-${item.id}`,
            total_score: item.score || 0,
            max_total_score: 10,
            overall_percentage: item.score || 0,
            grade: "N/A",
            board: "N/A",
            class: "N/A",
            homework_type: item.homework_type || "homework",
          };
        }
      });
      const homeworkItems = processed.filter((s) => {
        const worksheetId = s.worksheet_id || s.homework || "";
        return s.homework_type === "homework" || worksheetId.includes("HW") || worksheetId.includes("homework") || worksheetId.includes("hps");
      });
      const classworkItems = processed.filter((s) => {
        const worksheetId = s.worksheet_id || s.homework || "";
        return s.homework_type === "classwork" || worksheetId.includes("CW") || worksheetId.includes("classwork");
      });
      setHomeworkSubmissions(homeworkItems);
      setClassworkSubmissions(classworkItems);
    } catch (e) {
      setError("Failed to fetch homework submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "self") fetchRecentSessions();
    if (activeTab !== "self") fetchHomeworkSubmissions();
  }, [activeTab, fetchRecentSessions, fetchHomeworkSubmissions]);

  const filteredData = useMemo(() => {
    if (activeTab === "self") return recentSessions;
    if (activeTab === "classwork") return classworkSubmissions;
    return homeworkSubmissions;
  }, [activeTab, recentSessions, classworkSubmissions, homeworkSubmissions]);

  const isLoading = (activeTab === "self" && loadingSessions) || ((activeTab === "classwork" || activeTab === "homework") && loadingSubmissions);

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
    } catch {
      return "recently";
    }
  };

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

  const renderSessionItem = ({ item, index }) => (
    <TouchableOpacity
      key={String(index)}
      style={[styles.card, { borderLeftColor: getSessionColor(item.subject), borderLeftWidth: 4 }]}
      onPress={() => { setSelectedSession(item); setShowSessionDetails(true); }}
      activeOpacity={0.85}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titleSm, { color: getSessionColor(item.subject) }]}>{getSessionTitle(item)}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>{formatTimeAgo(item.date)}</Text>
          </View>
        </View>
        <View style={[styles.scorePill, { backgroundColor: (item.student_score ?? 0) >= 80 ? "#10b981" : (item.student_score ?? 0) >= 60 ? "#f59e0b" : "#ef4444" }]}>
          <Text style={styles.scoreText}>{item.student_score ?? 0}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusInfo = (submission) => {
    const percentage = submission.overall_percentage || 0;
    if (percentage >= 80) return { color: "#34A853", status: "Excellent" };
    if (percentage >= 60) return { color: "#FBBC05", status: "Good" };
    return { color: "#EA4335", status: "Needs Improvement" };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  const renderSubmissionItem = ({ item, index }) => {
    const statusInfo = getStatusInfo(item);
    const worksheetId = item.worksheet_id || item.homework || `Submission-${item.submission_id}`;
    return (
      <TouchableOpacity
        key={String(index)}
        style={[styles.card, { borderLeftColor: statusInfo.color, borderLeftWidth: 4 }]}
        activeOpacity={0.85}
        onPress={() => { setSelectedHomework(item); setShowHomeworkModal(true); }}
      >
        <Text style={styles.titleSm}>{worksheetId}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          <Text style={styles.metaText}>{formatDate(item.submission_date)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="information-circle-outline" size={14} color={statusInfo.color} />
          <Text style={[styles.metaText, { color: statusInfo.color, fontWeight: "600" }]}>{statusInfo.status}</Text>
        </View>
        <View style={{ height: 4, backgroundColor: "#e2e8f0", borderRadius: 4, marginTop: 8 }}>
          <View style={{ height: 4, width: `${item.overall_percentage || 0}%`, backgroundColor: statusInfo.color, borderRadius: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  const getTabCount = (tab) => {
    if (tab === "self") return recentSessions.length;
    if (tab === "classwork") return classworkSubmissions.length;
    return homeworkSubmissions.length;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Learning Activity</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {[
          { key: "self", label: "Self", icon: "person" },
          { key: "classwork", label: "Classwork", icon: "school" },
          { key: "homework", label: "Homework", icon: "home" },
        ].map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && styles.activeTab]}> 
            <Ionicons name={`${tab.icon}-outline`} size={16} color={activeTab === tab.key ? "#ffffff" : "#334155"} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label} ({getTabCount(tab.key)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="warning-outline" size={24} color="#ef4444" />
          <Text style={[styles.emptyTitle, { color: "#ef4444" }]}>Failed to load</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => (activeTab === "self" ? fetchRecentSessions() : fetchHomeworkSubmissions())} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="leaf-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyTitle}>{activeTab === "self" ? "You have not attempted any questions in recent sessions." : `No ${activeTab} submissions found.`}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={activeTab === "self" ? renderSessionItem : renderSubmissionItem}
          keyExtractor={(_, index) => String(index)}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}

      <SessionDetails visible={showSessionDetails} onClose={() => setShowSessionDetails(false)} session={selectedSession} />
      <HomeworkDetailsModal visible={showHomeworkModal} onClose={() => setShowHomeworkModal(false)} submission={selectedHomework} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
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
  centerContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSm: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaText: {
    marginLeft: 6,
    color: "#64748b",
    fontSize: 12,
  },
  scorePill: {
    paddingHorizontal: 10,
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
});

export default UnifiedSessions;






