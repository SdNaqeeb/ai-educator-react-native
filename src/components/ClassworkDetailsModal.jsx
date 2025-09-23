import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ClassworkDetailsModal = ({ visible, onClose, submission }) => {
  const questions = submission?.questions || [];

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
      case 'A+':
        return '#10b981';
      case 'B':
      case 'B+':
        return '#3b82f6';
      case 'C':
      case 'C+':
        return '#f59e0b';
      case 'D':
      case 'F':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Helper function to get error type info
  const getErrorTypeInfo = (errorType) => {
    switch (errorType) {
      case 'no_error':
        return { icon: 'checkmark-circle', color: '#10b981', label: 'no error' };
      case 'calculation_error':
        return { icon: 'close-circle', color: '#ef4444', label: 'Calculation Error' };
      case 'conceptual_error':
        return { icon: 'bulb', color: '#f59e0b', label: 'Conceptual Error' };
      case 'logical_error':
        return { icon: 'alert-circle', color: '#f59e0b', label: 'Logical Error' };
      default:
        return { icon: 'alert-circle', color: '#6b7280', label: errorType };
    }
  };

  // Helper function to get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="school" size={24} color="#ffffff" />
            <Text style={styles.headerTitle}>
              Classwork Details - {submission?.classwork_code || submission?.worksheet_id}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Submission Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <View style={styles.iconRow}>
                  <Ionicons name="calendar" size={16} color="#3b82f6" />
                  <Text style={styles.overviewLabel}>Submitted On:</Text>
                </View>
                <Text style={styles.overviewValue}>
                  {formatDate(submission?.submission_date)}
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <View style={styles.iconRow}>
                  <Ionicons name="bar-chart" size={16} color="#3b82f6" />
                  <Text style={styles.overviewLabel}>Overall Score:</Text>
                </View>
                <Text style={styles.overviewValue}>
                  {submission?.score || 0} / {submission?.max_possible_score || 0}
                </Text>
              </View>
            </View>

            {/* Grade Badge */}
            {submission?.grade && (
              <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(submission.grade) }]}>
                <Text style={styles.gradeText}>{submission.grade}</Text>
              </View>
            )}

            {/* Progress Bar */}
            {submission?.percentage !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Performance</Text>
                  <Text style={styles.progressValue}>{submission.percentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${submission.percentage}%`,
                        backgroundColor: getPercentageColor(submission.percentage),
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Questions Section */}
          <View style={styles.questionsHeader}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.questionsTitle}>Question-wise Analysis</Text>
          </View>

          {questions.length === 0 ? (
            <View style={styles.noQuestionsCard}>
              <Ionicons name="information-circle" size={24} color="#f59e0b" />
              <Text style={styles.noQuestionsText}>No questions found in this submission.</Text>
            </View>
          ) : (
            questions.map((q, index) => {
              const errorInfo = getErrorTypeInfo(q.error_type);
              const questionPercentage = q.percentage || ((q.total_score / q.max_marks) * 100) || 0;

              return (
                <View key={index} style={styles.questionCard}>
                  {/* Question Header */}
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                      Question {q.question_number || index + 1}
                    </Text>
                    <View style={styles.questionHeaderRight}>
                      <View style={[styles.errorBadge, { backgroundColor: errorInfo.color + '20' }]}>
                        <Ionicons name={errorInfo.icon} size={16} color={errorInfo.color} />
                        <Text style={[styles.errorLabel, { color: errorInfo.color }]}>
                          {errorInfo.label}
                        </Text>
                      </View>
                      <Text style={styles.scoreText}>
                        {q.total_score} / {q.max_marks}
                      </Text>
                    </View>
                  </View>

                  {/* Question Details */}
                  <View style={styles.questionBody}>
                    {/* Score Progress */}
                    {q.max_marks > 0 && (
                      <View style={styles.questionProgress}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${questionPercentage}%`,
                                backgroundColor: getPercentageColor(questionPercentage),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.percentageLabel}>
                          {Math.round(questionPercentage)}%
                        </Text>
                      </View>
                    )}

                    {/* Concepts Required */}
                    {q.concepts_required && q.concepts_required.length > 0 && (
                      <View style={styles.conceptsContainer}>
                        <Text style={styles.sectionLabel}>Concepts Required:</Text>
                        <View style={styles.conceptsGrid}>
                          {q.concepts_required.map((concept, idx) => (
                            <View key={idx} style={styles.conceptBadge}>
                              <Text style={styles.conceptText}>{concept}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Mistakes Made */}
                    {q.mistakes_made && q.mistakes_made !== "Question not attempted" && (
                      <View style={styles.mistakesContainer}>
                        <Text style={styles.mistakesLabel}>Mistakes Made:</Text>
                        <Text style={styles.mistakesText}>{q.mistakes_made}</Text>
                      </View>
                    )}

                    {/* Gap Analysis */}
                    {q.gap_analysis && (
                      <View style={styles.gapAnalysisCard}>
                        <View style={styles.gapAnalysisHeader}>
                          <Ionicons name="bulb" size={16} color="#3b82f6" />
                          <Text style={styles.gapAnalysisLabel}>Feedback:</Text>
                        </View>
                        <Text style={styles.gapAnalysisText}>{q.gap_analysis}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Full Gap Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  overviewItem: {
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '600',
  },
  overviewValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 4,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  gradeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  noQuestionsCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noQuestionsText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 12,
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  questionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  questionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  questionBody: {
    padding: 16,
  },
  questionProgress: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  conceptsContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  conceptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conceptBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  conceptText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  mistakesContainer: {
    marginBottom: 16,
  },
  mistakesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  mistakesText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  gapAnalysisCard: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  gapAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gapAnalysisLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginLeft: 8,
  },
  gapAnalysisText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ClassworkDetailsModal;