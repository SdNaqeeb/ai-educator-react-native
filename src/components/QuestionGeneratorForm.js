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
    { value: "solved", label: "Solved Examples" },
    { value: "exercise", label: "Practice Exercises" },
    { value: "external", label: "Question Sets" },
    { value: "worksheets", label: "Worksheets" },
  ];

  const subTopicOptions = subTopics.map((subTopic, index) => ({
    value: subTopic,
    label: `Set ${index + 1}`,
  }));

  const worksheetOptions = worksheets.map((worksheet) => ({
    value: worksheet.worksheet_name,
    label: worksheet.worksheet_name,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#3B82F6', '#6366F1']}
          style={styles.iconContainer}
        >
          <Ionicons name="library-outline" size={20} color="#ffffff" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>Question Generator</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Configure your study session by selecting the appropriate options below
      </Text>

      <View style={styles.formContainer}>
        {/* Class Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ionicons name="school-outline" size={16} color="#6366F1" /> Class
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
            <Ionicons name="book-outline" size={16} color="#6366F1" /> Subject
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
            <Ionicons name="list-outline" size={16} color="#6366F1" /> Chapters
            {chapters.length > 0 && (
              <Text style={styles.availableCount}> ({chapters.length} available)</Text>
            )}
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
            <Ionicons name="help-circle-outline" size={16} color="#6366F1" /> Question Type
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
              <Ionicons name="bookmark-outline" size={16} color="#6366F1" /> Select Question Set
            </Text>
            <CustomPicker
              selectedValue={questionLevel}
              onValueChange={setQuestionLevel}
              items={subTopicOptions}
              placeholder="Select Question Set"
            />
          </View>
        )}

        {/* Conditional: Worksheet Selection */}
        {questionType === "worksheets" && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="document-outline" size={16} color="#6366F1" /> Select Worksheet
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
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isEnabled ? ["#3B82F6", "#6366F1", "#8B5CF6"] : ["#94A3B8", "#94A3B8"]}
            style={styles.generateButtonGradient}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "play-circle-outline"}
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
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  availableCount: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectAllButton: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  clearButton: {
    borderColor: "#6B7280",
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  generateButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default QuestionGeneratorForm;