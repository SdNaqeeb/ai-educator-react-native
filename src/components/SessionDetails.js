import React, { useMemo } from "react";
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MathRichText from "../components/MathRichText"

const SessionDetails = ({ visible, onClose, session }) => {
  const formattedDate = useMemo(() => {
    if (!session?.date) return "";
    try {
      const date = new Date(session.date);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(session?.date ?? "");
    }
  }, [session]);

  const formatAIAnswer = (aiAnswer) => {
    if (!aiAnswer) return "No AI answer available";
    if (typeof aiAnswer === "string" && !aiAnswer.startsWith("[")) {
      return aiAnswer;
    }
    try {
      if (typeof aiAnswer === "string" && aiAnswer.startsWith("[") && aiAnswer.endsWith("]")) {
        const cleanStr = aiAnswer.replace(/^\[|\]$/g, "").trim();
        if (!cleanStr) return "No AI answer available";
        const items = cleanStr
        return items.map((item) => item.replace(/^['"]|['"]$/g, "").trim()).join("\n");
      }
      if (Array.isArray(aiAnswer)) {
        return aiAnswer.join("\n");
      }
    } catch {}
    return String(aiAnswer);
  };

  if (!visible || !session) return null;

  const subjectIsMath = session.subject?.toLowerCase().includes("math");

  const imageSrc = (maybeBase64) => {
    if (!maybeBase64) return null;
    const isData = String(maybeBase64).startsWith("data:");
    return { uri: isData ? maybeBase64 : `data:image/jpeg;base64,${maybeBase64}` };
  };

  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <Text style={styles.noStepsText}>No solution steps available.</Text>
    }

    return (
      <View style={styles.solutionSteps}>
        {steps.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i)
          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch
            return (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{stepNumber}</Text>
                  </View>
                  <Text style={styles.stepTitle}>Step {stepNumber}</Text>
                </View>
                <View style={styles.stepContentContainer}>
                  <MathRichText content={stepContent} />
                </View>
              </View>
            )
          } else {
            return (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{index+1}</Text>
                  </View>
                <View style={styles.stepContentContainer}>
                  <MathRichText content={step} />
                </View>
              </View>
            )
          }
        })}
      </View>
    )
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name={subjectIsMath ? "calculator" : "code-slash"} size={18} color="#334155" />
              <Text style={styles.titleText}>Session Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionHeaderTitle}>
                {session.subject} - {session.answering_type === "correct" ? "Exercise" : "Solved Examples"}
              </Text>
              <View style={styles.sessionMetaRow}>
                <Ionicons name="calendar" size={14} color="#475569" />
                <Text style={styles.sessionMetaText}>{formattedDate}</Text>
              </View>
              <View style={styles.badgesRow}>
                {session.class_name ? (
                  <View style={[styles.badge, { backgroundColor: "#e0f2fe" }]}>
                    <Text style={[styles.badgeText, { color: "#0369a1" }]}>Class {session.class_name}</Text>
                  </View>
                ) : null}
                {session.chapter_number ? (
                  <View style={[styles.badge, { backgroundColor: "#eef2ff" }]}>
                    <Text style={[styles.badgeText, { color: "#3730a3" }]}>Chapter {session.chapter_number}</Text>
                  </View>
                ) : null}
                {session.student_score !== undefined ? (
                  <View style={[styles.badge, { backgroundColor: session.student_score > 50 ? "#dcfce7" : "#fee2e2" }]}>
                    <Text style={[styles.badgeText, { color: session.student_score > 50 ? "#166534" : "#991b1b" }]}>Score: {session.student_score}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Question</Text>
            
              <MathRichText content={session.question_text} />
              {session.question_image_base64 && session.question_image_base64 !== "No image for question" ? (
                <Image source={imageSrc(session.question_image_base64)} style={styles.image} resizeMode="contain" />
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Your Answer</Text>
              {session.student_answer ? (
                // <Text style={styles.monoText}>{session.student_answer}</Text>
                <MathRichText content={session.student_answer} />
              ) : (
                <Text style={styles.bodyText}>No answer text</Text>
              )}
              {session.student_answer_base64 ? (
                <Image source={imageSrc(session.student_answer_base64)} style={styles.image} resizeMode="contain" />
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>AI Answer</Text>
              {/* <Text style={styles.monoText}>{formatAIAnswer(session.ai_answer)}</Text> */}
              {renderSolutionSteps(session.ai_answer_array)}
            </View>

            {session.comment ? (
              <View style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#334155" />
                  <Text style={[styles.cardHeader, { marginLeft: 6 }]}>Teacher's Comment</Text>
                </View>
                <Text style={styles.bodyText}>{session.comment}</Text>
              </View>
            ) : null}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionMetaText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0072F5",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: "#111827",
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "600",
   
  },

  monoText: {
   
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
  },
  image: {
    width: "100%",
    height: 200,
    marginTop: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
});

export default SessionDetails;



