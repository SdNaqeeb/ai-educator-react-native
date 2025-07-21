import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const QuestionDisplay = ({ question, showHint = false }) => {
  if (!question) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No question available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Ionicons name="help-circle" size={24} color="#667eea" />
          <Text style={styles.questionTitle}>Question</Text>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        {question.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: question.image }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {showHint && question.hint && (
          <View style={styles.hintContainer}>
            <View style={styles.hintHeader}>
              <Ionicons name="bulb" size={16} color="#f59e0b" />
              <Text style={styles.hintTitle}>Hint</Text>
            </View>
            <Text style={styles.hintText}>{question.hint}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginLeft: 8,
  },
  questionText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 16,
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  questionImage: {
    width: "100%",
    height: 200,
    minHeight: 150,
  },
  hintContainer: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  hintHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400e",
    marginLeft: 6,
  },
  hintText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default QuestionDisplay;
