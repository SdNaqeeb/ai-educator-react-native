import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import axiosInstance from "../api/axiosInstance";

import MathRichText from "../components/MathRichText";

const { width } = Dimensions.get("window");

const ResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [errorMessage, setErrorMessage] = useState(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [autoCalculatedScore, setAutoCalculatedScore] = useState(null);
  const [expandedConcepts, setExpandedConcepts] = useState({});

  // Extract data from route params (same as React.js location.state)
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
  } = route.params || {};

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
  } = ai_data || {};

  const formated_concepts_used = Array.isArray(concepts_used)
    ? concepts_used.join(", ")
    : concepts_used || "";

  // Combine student images from params and API response
  const getAllStudentImages = () => {
    const images = [];

    // Add images from params (uploaded/captured images)
    if (studentImages && studentImages.length > 0) {
      studentImages.forEach((imageUrl, index) => {
        images.push({
          src: imageUrl,
          type: "uploaded",
          label: `Uploaded Image`,
        });
      });
    }

    // Add processed image from API response
    if (student_answer_base64) {
      images.push({
        src: `data:image/jpeg;base64,${student_answer_base64}`,
        type: "processed",
        label: "Processed Solution",
      });
    }

    return images;
  };

  const allStudentImages = getAllStudentImages();

  // Auto-calculate score if none is provided from API
  useEffect(() => {
    if (
      (actionType === "submit" || actionType === "correct") &&
      student_answer &&
      obtained_marks === undefined &&
      score === undefined
    ) {
      calculateAutoScore();
    }
  }, [ai_data, actionType, student_answer]);

  // Function to calculate score based on student answer
  const calculateAutoScore = async () => {
    if (!student_answer || !question) {
      return;
    }

    setIsCalculatingScore(true);

    try {
      const aiScoringResponse = await axiosInstance
        .post("/auto-score/", {
          student_answer,
          question,
          expected_solution: ai_explaination || solution || [],
          total_marks: total_marks || question_marks || 10,
        })
        .catch(() => null);

      if (aiScoringResponse?.data?.score !== undefined) {
        setAutoCalculatedScore(aiScoringResponse.data.score);
      } else {
        const fallbackScore = calculateFallbackScore();
        setAutoCalculatedScore(fallbackScore);
      }
    } catch (error) {
      console.error("Error calculating score:", error);
      const fallbackScore = calculateFallbackScore();
      setAutoCalculatedScore(fallbackScore);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Fallback scoring method using keyword matching
  const calculateFallbackScore = () => {
    const totalMark = total_marks || question_marks || 10;

    const expectedSolution = Array.isArray(ai_explaination)
      ? ai_explaination.join(" ")
      : Array.isArray(solution)
      ? solution.join(" ")
      : "";

    if (!expectedSolution) {
      return 0;
    }

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "")
        .trim();
    };

    const normalizedStudentAnswer = normalizeText(student_answer);
    const normalizedSolution = normalizeText(expectedSolution);

    const extractKeywords = (text) => {
      const commonWords = [
        "the",
        "and",
        "is",
        "in",
        "of",
        "to",
        "for",
        "a",
        "by",
        "with",
        "as",
      ];
      const words = text.split(/\s+/);
      return words.filter(
        (word) => word.length > 2 && !commonWords.includes(word)
      );
    };

    const solutionKeywords = extractKeywords(normalizedSolution);
    const studentKeywords = extractKeywords(normalizedStudentAnswer);

    let matchCount = 0;
    for (const keyword of solutionKeywords) {
      if (studentKeywords.includes(keyword)) {
        matchCount++;
      }
    }

    const matchPercentage =
      solutionKeywords.length > 0 ? matchCount / solutionKeywords.length : 0;

    let calculatedScore = Math.round(matchPercentage * totalMark);

    if (
      calculatedScore === 0 &&
      matchCount > 0 &&
      normalizedStudentAnswer.length > 10
    ) {
      calculatedScore = 1;
    }

    if (matchPercentage > 0.8) {
      calculatedScore = totalMark;
    }

    return calculatedScore;
  };

  const handleBack = () => {
    navigation.navigate("SolveQuestion", {
      questionList: questionList,
      class_id: class_id,
      subject_id: subject_id,
      topic_ids: topic_ids,
      subtopic: subtopic,
      worksheet_id: "",
      questionType: "",
    });
  };

  const handlePracticeSimilar = () => {
    if (!question && !routeQuestion) {
      Alert.alert("Error", "No question available for practice");
      return;
    }

    navigation.navigate("SimilarQuestions", {  // Make sure this matches your navigation stack
      originalQuestion: question || routeQuestion,
      class_id,
      subject_id,
      topic_ids,
      subtopic,
      questionImage,
      solution: ai_explaination || solution,
    });
  };

  const handleQuestionList = () => {
    // Navigate to a question list modal or screen
    Alert.alert(
      "Question List",
      "Question list functionality can be implemented here"
    );
  };

  // Display the score with proper formatting
  const renderScore = () => {
    const scoreFromApi =
      obtained_marks !== undefined
        ? typeof obtained_marks === "number"
          ? obtained_marks
          : parseInt(obtained_marks, 10)
        : score !== undefined
        ? typeof score === "number"
          ? score
          : parseInt(score, 10)
        : null;

    const totalValue =
      total_marks !== undefined
        ? typeof total_marks === "number"
          ? total_marks
          : parseInt(total_marks, 10)
        : question_marks !== undefined
        ? typeof question_marks === "number"
          ? question_marks
          : parseInt(question_marks, 10)
        : 10;

    if (scoreFromApi !== null) {
      return (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {scoreFromApi} / {totalValue}
          </Text>
        </View>
      );
    }

    if (autoCalculatedScore !== null) {
      return (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {autoCalculatedScore} / {totalValue}
          </Text>
        </View>
      );
    }

    if (isCalculatingScore) {
      return (
        <View style={styles.scoreContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.calculatingText}>Calculating Score...</Text>
        </View>
      );
    }

    return null;
  };

  // Function to render solution steps
  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return (
        <Text style={styles.noStepsText}>No solution steps available.</Text>
      );
    }

    return (
      <View style={styles.solutionSteps}>
        {steps.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i);

          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch;
            return (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Step {stepNumber}:</Text>
                <Text style={styles.stepContent}> {""}</Text>
                <MathRichText style={styles.stepContent} content={stepContent} />
              </View>
            );
          } else {
            return (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.stepContent}>{step}</Text>
              </View>
            );
          }
        })}
      </View>
    );
  };

  const toggleConceptExpansion = (index) => {
    setExpandedConcepts((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderContentBasedOnAction = () => {
    if (!actionType) {
      return (
        <Text style={styles.errorText}>
          No action type provided. Unable to display results.
        </Text>
      );
    }

    switch (actionType) {
      case "submit":
        return (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Answer:</Text>
              <Text style={styles.sectionContent}>
                {student_answer || userAnswer || "No answer submitted"}
              </Text>
            </View>
            {renderScore()}
            {comment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Comments:</Text>
                {/* <Text >{comment}</Text>  */}
                 <MathRichText content={comment} />
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concepts Used:</Text>
                <Text style={styles.sectionContent}> </Text>
                <MathRichText content={formated_concepts_used} /> 
               
              </View>
            )}
          </View>
        );

      case "solve":
        return (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Solution:</Text>
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
                <Text style={styles.sectionTitle}>Comments:</Text>
                {/* <Text style={styles.sectionContent}>{comment}</Text> */}
                <MathRichText content={comment} />
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concepts Used:</Text>
                 <MathRichText content={formated_concepts_used} /> 
              </View>
            )}
          </View>
        );

      case "correct":
        return (
          <View>
            <View style={styles.section}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Student Answer:</Text>
                <MathRichText content={student_answer} />
              </View>
              <Text style={styles.sectionTitle}>AI Solution:</Text>
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
                <Text style={styles.sectionTitle}>Comments:</Text>
                <MathRichText style={styles.sectionContent} content={comment} />
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concepts Required:</Text>
                <MathRichText content={formated_concepts_used} /> 
              </View>
            )}
          </View>
        );

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
                    >
                      <Text style={styles.conceptTitle}>
                        Concept {index + 1}: {conceptItem.concept}
                      </Text>
                      <Ionicons
                        name={
                          expandedConcepts[index]
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {expandedConcepts[index] && (
                      <View style={styles.conceptBody}>
                        <Text style={styles.chapterName}>
                          Chapter: {conceptItem.chapter}
                        </Text>
                        {conceptItem.example && (
                          <View style={styles.exampleSection}>
                            <Text style={styles.exampleTitle}>Example:</Text>
                            <Text style={styles.exampleText}>
                            {conceptItem.example && (
                          <View className="example-content">
                             <MathRichText content={conceptItem.example.problem} />  
                            <Text className='example-header'>Solution:</Text>
                            <MathRichText content={conceptItem.example.solution} /> 
                          </View>
                          
                        )}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.explanationTitle}>
                          Explanation:
                        </Text>
                        {/* <Text style={styles.explanationText}>
                          {conceptItem.explanation}
                        </Text> */}
                           <MathRichText content={conceptItem.explanation} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            {comment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Comments:</Text>
                <MathRichText content={comment} />
              </View>
            )}
            {formated_concepts_used && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concepts Used:</Text>
                <MathRichText content={formated_concepts_used} /> 
              </View>
            )}
          </View>
        );

      default:
        return (
          <Text style={styles.errorText}>
            Unknown action type. Unable to display results.
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Result</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>
            Question {questionNumber || 1}:
          </Text>
          <Text style={styles.questionText}>
          <MathRichText content={question || routeQuestion || "No question available"} /> 
          </Text>
          {questionImage && (
            <Image
              source={{ uri: questionImage }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Student Images Section */}

              
            {student_answer_base64 && (
  <View style={styles.studentImageWrapper}>
    <Image
      source={{ uri: `data:image/jpeg;base64,${student_answer_base64}` }}
      style={styles.studentImage}
      resizeMode="cover"
    />
    <View style={styles.processedBadge}>
      <Text style={styles.badgeText}>AI Processed</Text>
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

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleQuestionList}
        >
          <Text style={styles.bottomButtonText}>Question List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.primaryButton]}
          onPress={handlePracticeSimilar}
        >
          <Text style={[styles.bottomButtonText, styles.primaryButtonText]}>
            Similar Questions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
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
    fontWeight: "bold",
    color: "#ffffff",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  questionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  questionImage: {
    width: "100%",
    height: 200,
    marginTop: 12,
    borderRadius: 8,
  },
  studentImagesSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentImageWrapper: {
    marginRight: 12,
    alignItems: "center",
  },
  studentImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  processedBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  scoreContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginLeft: 8,
  },
  calculatingText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  solutionImage: {
    width: "100%",
    height: 200,
    marginVertical: 12,
    borderRadius: 8,
  },
  solutionSteps: {
    marginTop: 8,
  },
  stepContainer: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 4,
  },
  stepContent: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  noStepsText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  conceptsContainer: {
    marginBottom: 16,
  },
  conceptCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conceptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
    flex: 1,
  },
  conceptBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  chapterName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  exampleSection: {
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  bottomButtons: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
});

export default ResultScreen;