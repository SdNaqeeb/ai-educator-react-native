"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import axiosInstance from "../api/axiosInstance"
import MathRichText from "../components/MathRichText"

const { width } = Dimensions.get("window")

const ResultScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const [errorMessage, setErrorMessage] = useState(null)
  const [isCalculatingScore, setIsCalculatingScore] = useState(false)
  const [autoCalculatedScore, setAutoCalculatedScore] = useState(null)
  const [expandedConcepts, setExpandedConcepts] = useState({})

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  // Extract data from route params
  const {
    message,
    ai_data,
    actionType,
    questionList,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    questionImage,
    questionNumber,
    studentImages = [],
    question: routeQuestion,
    userAnswer,
  } = route.params || {}

  const {
    question,
    ai_explaination,
    student_answer,
    concepts,
    comment,
    concepts_used,
    solution,
    score,
    obtained_marks,
    total_marks,
    question_marks,
    question_image_base64,
    student_answer_base64,
  } = ai_data || {}

  const formated_concepts_used = Array.isArray(concepts_used) ? concepts_used.join(", ") : concepts_used || ""

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    if (
      (actionType === "submit" || actionType === "correct") &&
      student_answer &&
      obtained_marks === undefined &&
      score === undefined
    ) {
      calculateAutoScore()
    }
  }, [ai_data, actionType, student_answer])

  const calculateAutoScore = async () => {
    if (!student_answer || !question) {
      return
    }
    setIsCalculatingScore(true)
    try {
      const aiScoringResponse = await axiosInstance
        .post("/auto-score/", {
          student_answer,
          question,
          expected_solution: ai_explaination || solution || [],
          total_marks: total_marks || question_marks || 10,
        })
        .catch(() => null)

      if (aiScoringResponse?.data?.score !== undefined) {
        setAutoCalculatedScore(aiScoringResponse.data.score)
      } else {
        const fallbackScore = calculateFallbackScore()
        setAutoCalculatedScore(fallbackScore)
      }
    } catch (error) {
      console.error("Error calculating score:", error)
      const fallbackScore = calculateFallbackScore()
      setAutoCalculatedScore(fallbackScore)
    } finally {
      setIsCalculatingScore(false)
    }
  }

  const calculateFallbackScore = () => {
    const totalMark = total_marks || question_marks || 10
    const expectedSolution = Array.isArray(ai_explaination)
      ? ai_explaination.join(" ")
      : Array.isArray(solution)
        ? solution.join(" ")
        : ""

    if (!expectedSolution) {
      return 0
    }

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "")
        .trim()
    }

    const normalizedStudentAnswer = normalizeText(student_answer)
    const normalizedSolution = normalizeText(expectedSolution)

    const extractKeywords = (text) => {
      const commonWords = ["the", "and", "is", "in", "of", "to", "for", "a", "by", "with", "as"]
      const words = text.split(/\s+/)
      return words.filter((word) => word.length > 2 && !commonWords.includes(word))
    }

    const solutionKeywords = extractKeywords(normalizedSolution)
    const studentKeywords = extractKeywords(normalizedStudentAnswer)

    let matchCount = 0
    for (const keyword of solutionKeywords) {
      if (studentKeywords.includes(keyword)) {
        matchCount++
      }
    }

    const matchPercentage = solutionKeywords.length > 0 ? matchCount / solutionKeywords.length : 0

    let calculatedScore = Math.round(matchPercentage * totalMark)

    if (calculatedScore === 0 && matchCount > 0 && normalizedStudentAnswer.length > 10) {
      calculatedScore = 1
    }

    if (matchPercentage > 0.8) {
      calculatedScore = totalMark
    }

    return calculatedScore
  }

  const handleBack = () => {
    navigation.navigate("SolveQuestion", {
      questionList: questionList,
      class_id: class_id,
      subject_id: subject_id,
      topic_ids: topic_ids,
      subtopic: subtopic,
      worksheet_id: "",
      questionType: "",
    })
  }

  const handlePracticeSimilar = () => {
    if (!question && !routeQuestion) {
      Alert.alert("Error", "No question available for practice")
      return
    }
    navigation.navigate("SimilarQuestions", {
      originalQuestion: question || routeQuestion,
      class_id,
      subject_id,
      topic_ids,
      subtopic,
      questionImage,
      solution: ai_explaination || solution,
    })
  }

  const handleQuestionList = () => {
    Alert.alert("Question List", "Question list functionality can be implemented here")
  }

  const renderScore = () => {
    const scoreFromApi =
      obtained_marks !== undefined
        ? typeof obtained_marks === "number"
          ? obtained_marks
          : Number.parseInt(obtained_marks, 10)
        : score !== undefined
          ? typeof score === "number"
            ? score
            : Number.parseInt(score, 10)
          : null

    const totalValue =
      total_marks !== undefined
        ? typeof total_marks === "number"
          ? total_marks
          : Number.parseInt(total_marks, 10)
        : question_marks !== undefined
          ? typeof question_marks === "number"
            ? question_marks
            : Number.parseInt(question_marks, 10)
          : 10

    if (scoreFromApi !== null) {
      return (
        <View style={styles.scoreContainer}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.scoreGradient}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.scoreText}>
              Score: {scoreFromApi} / {totalValue}
            </Text>
          </LinearGradient>
        </View>
      )
    }

    if (autoCalculatedScore !== null) {
      return (
        <View style={styles.scoreContainer}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.scoreGradient}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.scoreText}>
              Score: {autoCalculatedScore} / {totalValue}
            </Text>
          </LinearGradient>
        </View>
      )
    }

    if (isCalculatingScore) {
      return (
        <View style={styles.scoreContainer}>
          <View style={styles.calculatingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.calculatingText}>Calculating Score...</Text>
          </View>
        </View>
      )
    }

    return null
  }

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

  const toggleConceptExpansion = (index) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const renderContentBasedOnAction = () => {
    if (!actionType) {
      return <Text style={styles.errorText}>No action type provided. Unable to display results.</Text>
    }

    switch (actionType) {
      case "submit":
        return (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Your Answer</Text>
              </View>
              <View style={styles.mathContentContainer}>
                <MathRichText content={student_answer || userAnswer || "No answer submitted"} />
              </View>
            </View>
            {renderScore()}
            {comment && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Feedback</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={comment} />
                </View>
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="library-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Concepts Used</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={formated_concepts_used} />
                </View>
              </View>
            )}
          </View>
        )

      case "solve":
        return (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>AI Solution</Text>
              </View>
              {question_image_base64 && (
                <Image
                  source={{
                    uri: `data:image/jpeg;base64,${question_image_base64}`,
                  }}
                  style={styles.solutionImage}
                  resizeMode="contain"
                />
              )}
              {renderSolutionSteps(ai_explaination)}
            </View>
            {comment && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Additional Notes</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={comment} />
                </View>
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="library-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Concepts Used</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={formated_concepts_used} />
                </View>
              </View>
            )}
          </View>
        )

      case "correct":
        return (
          <View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Your Answer</Text>
              </View>
              <View style={styles.mathContentContainer}>
                <MathRichText content={student_answer} />
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>AI Solution</Text>
              </View>
              {question_image_base64 && (
                <Image
                  source={{
                    uri: `data:image/jpeg;base64,${question_image_base64}`,
                  }}
                  style={styles.solutionImage}
                  resizeMode="contain"
                />
              )}
              {renderSolutionSteps(ai_explaination)}
            </View>
            {renderScore()}
            {comment && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Feedback</Text>
                </View>
                <View >
                  <MathRichText content={comment} />
                </View>
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="library-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Concepts Required</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={formated_concepts_used} />
                </View>
              </View>
            )}
          </View>
        )

      case "explain":
        return (
          <View>
            {concepts && concepts.length > 0 && (
              <View style={styles.conceptsContainer}>
                {concepts.map((conceptItem, index) => (
                  <View key={index} style={styles.conceptCard}>
                    <TouchableOpacity
                      style={styles.conceptHeader}
                      onPress={() => toggleConceptExpansion(index)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.conceptTitleContainer}>
                        <View style={styles.conceptNumberContainer}>
                          <Text style={styles.conceptNumber}>{index + 1}</Text>
                        </View>
                        <Text style={styles.conceptTitle}>{conceptItem.concept}</Text>
                      </View>
                      <Ionicons
                        name={expandedConcepts[index] ? "chevron-up-outline" : "chevron-down-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                    {expandedConcepts[index] && (
                      <View style={styles.conceptBody}>
                        <Text style={styles.chapterName}>Chapter: {conceptItem.chapter}</Text>
                        {conceptItem.example && (
                          <View style={styles.exampleSection}>
                            <Text style={styles.exampleTitle}>Example:</Text>
                            <View style={styles.mathContentContainer}>
                              <MathRichText content={conceptItem.example} />
                            </View>
                            <Text style={styles.exampleTitle}>Solution:</Text>
                            <View style={styles.mathContentContainer}>
                              <MathRichText content={conceptItem.application} />
                            </View>
                          </View>
                        )}
                        <Text style={styles.explanationTitle}>Explanation:</Text>
                        <View style={styles.mathContentContainer}>
                          <MathRichText content={conceptItem.explanation} />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            {comment && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Additional Notes</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={comment} />
                </View>
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="library-outline" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Concepts Used</Text>
                </View>
                <View style={styles.mathContentContainer}>
                  <MathRichText content={formated_concepts_used} />
                </View>
              </View>
            )}
          </View>
        )

      default:
        return <Text style={styles.errorText}>Unknown action type. Unable to display results.</Text>
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#3B82F6", "#6366F1", "#8B5CF6"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Question Section */}
          <View style={styles.questionSection}>
            <View style={styles.questionHeader}>
              <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.questionTitle}>Question {questionNumber || 1}</Text>
            </View>
            <View style={styles.mathContentContainer}>
              <MathRichText content={question || routeQuestion || "No question available"} />
            </View>
            {questionImage && (
              <Image source={{ uri: questionImage }} style={styles.questionImage} resizeMode="contain" />
            )}
          </View>

          {/* Student Images Section */}
          {student_answer_base64 && (
            <View style={styles.studentImageSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="camera-outline" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Your Solution Image</Text>
              </View>
              <View style={styles.studentImageWrapper}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${student_answer_base64}` }}
                  style={styles.studentImage}
                  resizeMode="contain"
                />
                <View style={styles.processedBadge}>
                  <Text style={styles.badgeText}>AI Processed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Main Content */}
          {renderContentBasedOnAction()}
        </ScrollView>
      </Animated.View>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.bottomButton} onPress={handleQuestionList} activeOpacity={0.8}>
          <Ionicons name="list-outline" size={18} color="#6B7280" />
          <Text style={styles.bottomButtonText}>Question List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.primaryButton]}
          onPress={handlePracticeSimilar}
          activeOpacity={0.8}
        >
          <LinearGradient colors={["#3B82F6", "#6366F1"]} style={styles.primaryButtonGradient}>
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={[styles.bottomButtonText, styles.primaryButtonText]}>Similar Questions</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  questionImage: {
    width: "100%",
    height: 200,
    marginTop: 16,
    borderRadius: 12,
  },
  studentImageSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  studentImageWrapper: {
    alignItems: "center",
    marginTop: 12,
  },
  studentImage: {
    width: Math.min(width - 80, 400),
    height: 200,
    borderRadius: 12,
  },
  processedBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  mathContentContainer: {
    width: "100%",
    overflow: "hidden", // Prevent any overflow
  },
  scoreContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  calculatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  calculatingText: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 8,
  },
  solutionImage: {
    width: "100%",
    height: 200,
    marginVertical: 16,
    borderRadius: 12,
  },
  solutionSteps: {
    marginTop: 12,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    color: "#ffffff",
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  stepContentContainer: {
    marginLeft: 32,
    width: width - 112, // Account for padding and step number
    overflow: "hidden",
  },
  noStepsText: {
    fontSize: 15,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  conceptsContainer: {
    marginBottom: 16,
  },
  conceptCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  conceptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  conceptTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  conceptNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conceptNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  conceptBody: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  chapterName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 12,
  },
  exampleSection: {
    marginBottom: 16,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  bottomButtons: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#ffffff",
  },
  primaryButton: {
    borderWidth: 0,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
  },
})

export default ResultScreen
