import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import CustomPicker from "./CustomPicker";
import MultiSelectPicker from "./MultiSelectPicker";

const QuestionGeneratorForm = ({
  classes,
  subjects,
  chapters,
  selectedClass,
  setSelectedClass,
  selectedSubject,
  setSelectedSubject,
  selectedChapters,
  setSelectedChapters,
  questionType,
  setQuestionType,
  questionLevel,
  setQuestionLevel,
  selectedWorksheet,
  setSelectedWorksheet,
  subTopics,
  worksheets,
  onGenerate,
  isEnabled,
  loading,
}) => {
  const questionTypes = [
    { value: "solved", label: "📚 Solved Examples" },
    { value: "exercise", label: "💪 Practice Exercises" },
    { value: "external", label: "🎯 Set of Questions" },
    { value: "worksheets", label: "📄 Worksheets" },
  ];

  const subTopicOptions = subTopics.map((subTopic, index) => ({
    value: subTopic,
    label: `Exercise ${index + 1}`,
  }));

  const worksheetOptions = worksheets.map((worksheet) => ({
    value: worksheet.worksheet_name,
    label: worksheet.worksheet_name,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="rocket" size={24} color="#667eea" />
        <Text style={styles.sectionTitle}>
          🚀 Start Your Learning Adventure
        </Text>
      </View>
      <Text style={styles.sectionDescription}>
        Select your preferences and let's begin this exciting mathematical
        journey!
      </Text>

      <View style={styles.formContainer}>
        {/* Class Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ionicons name="school" size={16} color="#667eea" /> Class
          </Text>
          <CustomPicker
            selectedValue={selectedClass}
            onValueChange={setSelectedClass}
            items={classes.map((cls) => ({
              value: cls.class_code,
              label: cls.class_name,
            }))}
            placeholder="Select Class"
          />
        </View>

        {/* Subject Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ionicons name="book" size={16} color="#667eea" /> Subject
          </Text>
          <CustomPicker
            selectedValue={selectedSubject}
            onValueChange={setSelectedSubject}
            items={subjects.map((subject) => ({
              value: subject.subject_code,
              label: subject.subject_name,
            }))}
            placeholder="Select Subject"
            disabled={!selectedClass}
          />
        </View>

        {/* Chapters Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ionicons name="list" size={16} color="#667eea" /> Chapters (Select
            Multiple) - {chapters.length} Available
          </Text>
          <MultiSelectPicker
            selectedValues={selectedChapters}
            onValuesChange={setSelectedChapters}
            items={chapters.map((chapter) => ({
              value: chapter.topic_code,
              label: chapter.name,
            }))}
            placeholder="Select chapters..."
            disabled={!selectedSubject || chapters.length === 0}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.selectAllButton]}
              onPress={() =>
                setSelectedChapters(chapters.map((ch) => ch.topic_code))
              }
              disabled={!chapters.length}
            >
              <Text style={styles.actionButtonText}>
                Select All ({chapters.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => setSelectedChapters([])}
              disabled={!selectedChapters.length}
            >
              <Text style={styles.actionButtonText}>
                Clear ({selectedChapters.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Type Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ionicons name="help-circle" size={16} color="#667eea" /> Question
            Type
          </Text>
          <CustomPicker
            selectedValue={questionType}
            onValueChange={setQuestionType}
            items={questionTypes}
            placeholder="Select Question Type"
            disabled={selectedChapters.length === 0}
          />
        </View>

        {/* Conditional: External Question Level */}
        {questionType === "external" && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="bookmark" size={16} color="#667eea" /> Select The
              Set
            </Text>
            <CustomPicker
              selectedValue={questionLevel}
              onValueChange={setQuestionLevel}
              items={subTopicOptions}
              placeholder="Select The Set"
            />
          </View>
        )}

        {/* Conditional: Worksheet Selection */}
        {questionType === "worksheets" && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="document" size={16} color="#667eea" /> Select
              Worksheet
            </Text>
            <CustomPicker
              selectedValue={selectedWorksheet}
              onValueChange={setSelectedWorksheet}
              items={worksheetOptions}
              placeholder="Select Worksheet"
            />
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            !isEnabled && styles.generateButtonDisabled,
          ]}
          onPress={onGenerate}
          disabled={!isEnabled || loading}
        >
          <LinearGradient
            colors={isEnabled ? ["#667eea", "#764ba2"] : ["#94a3b8", "#94a3b8"]}
            style={styles.generateButtonGradient}
          >
            <Ionicons
              name={loading ? "hourglass" : "rocket"}
              size={20}
              color="#ffffff"
              style={styles.buttonIcon}
            />
            <Text style={styles.generateButtonText}>
              {loading ? "Generating..." : "Generate Questions"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a202c",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectAllButton: {
    borderColor: "#667eea",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
  },
  clearButton: {
    borderColor: "#6b7280",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  generateButton: {
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default QuestionGeneratorForm;
