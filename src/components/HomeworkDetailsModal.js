import React, { useMemo } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import MathRichText from "./MathRichText";

const HomeworkDetailsModal = ({ visible, onClose, submission }) => {
  const questions = useMemo(() => submission?.result_json?.questions || [], [submission]);
  const submittedOn = useMemo(() => {
    const ts = submission?.submission_timestamp || submission?.submission_date;
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }, [submission]);

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Homework Details - {submission?.worksheet_id || submission?.homework}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.meta}><Text style={styles.metaStrong}>Submitted On:</Text> {submittedOn}</Text>
            </View>

            {questions.length === 0 ? (
              <Text style={styles.noQuestions}>No questions found in this submission.</Text>
            ) : (
              questions.map((q, i) => (
                <View key={String(i)} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>Q{i + 1}: {q.question}</Text>
                
                  <Text style={styles.questionMeta}><Text style={styles.metaStrong}>Score:</Text> {q.total_score} / {q.max_score ||q.max_marks}</Text>
                  <Text style={styles.questionMeta}><Text style={styles.metaStrong}>Category:</Text> {q.answer_category ||q.error_type}</Text>
                  <Text style={styles.questionMeta}><Text style={styles.metaStrong}>Concepts:</Text> {(q.concept_required || []).join(', ') ||(q.concepts_required || []).join(', ') }</Text>
                  <Text style={styles.questionMeta}><Text style={styles.metaStrong}>Feedback:</Text> {q.comment || q.gap_analysis}</Text>
                  <Text style={styles.questionMeta}><Text style={styles.metaStrong}>Correction:</Text>{q.correction_comment || q.mistakes_made}</Text>
                  <MathRichText content={q.correction_comment} />
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  closeText: {
    color: "#334155",
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  meta: {
    color: "#475569",
    fontSize: 13,
  },
  metaStrong: {
    fontWeight: "bold",
    fontSize:20,
    color: "#111827",
  },
  noQuestions: {
    color: "#ef4444",
    fontSize: 14,
  },
  questionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  questionMeta: {
    color: "#374151",
    fontSize: 18,
    marginTop: 2,
  },
});

export default HomeworkDetailsModal;



