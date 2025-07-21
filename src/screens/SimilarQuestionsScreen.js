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
import MarkdownWithMath from "../components/MarkdownWithMath";

const { width } = Dimensions.get("window");

const SimilarQuestionsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [similarQuestions, setSimilarQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Extract data from route params
  const {
    originalQuestion,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    questionImage,
    solution,
  } = route.params || {};

  useEffect(() => {
    fetchSimilarQuestions();
  }, []);

  // Function to fetch similar questions from API
  const fetchSimilarQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if original question exists
      if (!originalQuestion) {
        throw new Error("Original question not found");
      }

      console.log("Sending request with question:", originalQuestion);

      // Make API call
      const response = await axiosInstance.post("/similarquestion/", {
        question: originalQuestion,
        request_specific_concepts: true,
      });

      console.log("API Response:", response.data);
      setSimilarQuestions(response.data);
    } catch (err) {
      console.error("Error fetching similar questions:", err);
      // Generate fallback similar questions
      generateFallbackSimilarQuestions();
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback similar questions when API fails
  const generateFallbackSimilarQuestions = () => {
    if (!originalQuestion) return;

    let specificConcepts = "";

    // Check question keywords for specific concepts
    const questionLower = originalQuestion.toLowerCase();

    if (questionLower.includes("circle") || questionLower.includes("tangent")) {
      specificConcepts = `1. CIRCLE PROPERTIES:
- A circle is a set of points that are equidistant from a given point (the center).
- The radius is the distance from the center to any point on the circle.
- Tangents to a circle are perpendicular to the radius at the point of tangency.

2. TANGENT PROPERTIES:
- A tangent to a circle touches the circle at exactly one point.
- If two tangents are drawn to a circle from an external point, they are equal in length.
- The tangent at any point on a circle is perpendicular to the radius drawn to that point.

3. PARALLEL LINES AND ANGLES:
- When parallel lines are cut by a transversal, corresponding angles are equal.
- When parallel lines are cut by a transversal, alternate angles are equal.
- The sum of angles in a triangle equals 180 degrees.

4. ANGLE IN A SEMICIRCLE:
- An angle inscribed in a semicircle is always 90 degrees (a right angle).`;
    } else if (
      questionLower.includes("cylinder") ||
      questionLower.includes("hemisphere")
    ) {
      specificConcepts = `1. CORE CONCEPTS:
- Cylinder: A three-dimensional shape with two parallel circular bases and a curved surface connecting the bases.
- Hemisphere: Half of a sphere, having a curved surface and a flat circular face.
- Surface Area: The total area that the surface of a three-dimensional object occupies.
- Modification of Solids: When parts are removed from a solid, care must be taken to account for added or removed surfaces.

2. DETAILED EXPLANATION:
- We start with a cylinder of height h and base radius r.
- Two hemispheres with the same radius are scooped out from both ends of the cylinder.
- By removing each hemisphere, the flat circular ends of the cylinder are no longer part of the surface.

3. PROBLEM-SOLVING APPROACH:
- Step 1: Calculate the lateral surface area of the cylinder using the formula: 2πrh.
- Step 2: Calculate the curved surface area of one hemisphere using the formula: 2πr².
- Step 3: Add the lateral surface area of the cylinder to the total curved surface area of the hemispheres.

4. FORMULAS AND PRINCIPLES:
- Lateral Surface Area of Cylinder: 2πrh
- Curved Surface Area of a Hemisphere: 2πr²
- Total Surface Area: Combine the lateral surface area and curved surface areas.`;
    } else {
      specificConcepts = `1. UNDERSTANDING THE PROBLEM:
- Identify what is given in the problem.
- Determine what is being asked for.
- Recognize the relevant mathematical concepts involved.

2. STRATEGY SELECTION:
- Choose appropriate formulas and methods based on the problem type.
- Break down complex problems into smaller, manageable parts.
- Consider alternative approaches if direct methods are challenging.

3. SYSTEMATIC SOLUTION PROCESS:
- Apply selected formulas correctly with the given values.
- Perform calculations step by step to avoid errors.
- Check intermediate results for reasonableness.

4. VERIFICATION AND INTERPRETATION:
- Verify the solution by checking if it satisfies all conditions of the problem.
- Interpret the answer in the context of the original problem.
- Consider if the solution makes physical or practical sense.`;
    }

    const fallbackData = {
      similar_question: `"${originalQuestion.substring(0, 100)}..."`,
      theory_concepts: specificConcepts,
    };

    setSimilarQuestions(fallbackData);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleBackToDashboard = () => {
    navigation.navigate("Dashboard");
  };

  const handleSolveQuestion = (question) => {
    navigation.navigate("SolveQuestion", {
      question: question.similar_question,
      class_id,
      subject_id,
      topic_ids,
      subtopic,
      questionImage,
      questionList: [question.similar_question],
      questionType: "similar",
    });
  };

  // Render theoretical concepts
  const renderTheoreticalConcepts = () => {
    if (!similarQuestions || !similarQuestions.theory_concepts) {
      return null;
    }

    const concepts = similarQuestions.theory_concepts.split("\n");

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Theoretical Concepts</Text>
        <View style={styles.conceptsContainer}>
          {concepts.map((paragraph, index) => {
            const trimmedPara = paragraph.trim();
            if (!trimmedPara) return null;

            // Format section headers
            if (trimmedPara.match(/^\d+\.\s+[A-Z\s]+:?/)) {
              return (
                <View key={index} style={styles.conceptHeader}>
                  <Text style={styles.conceptTitle}>{trimmedPara}</Text>
                </View>
              );
            }

            // Format bullet points
            if (trimmedPara.startsWith("-")) {
              return (
                <View key={index} style={styles.conceptPoint}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <MarkdownWithMath
                    content={trimmedPara.substring(1).trim()}
                    style={styles.conceptText}
                  />
                </View>
              );
            }

            // Regular paragraphs
            return (
              <Text key={index} style={styles.conceptParagraph}>
                {trimmedPara}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Similar Questions</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading similar questions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Similar Questions</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Original Question Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Original Question</Text>
          <MarkdownWithMath
            content={originalQuestion || "No question available"}
            style={styles.questionText}
          />
          {questionImage && (
            <Image
              source={{ uri: questionImage }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Theoretical Concepts */}
        {renderTheoreticalConcepts()}

        {/* Similar Question Card */}
        {similarQuestions && similarQuestions.similar_question && (
          <View style={[styles.card, styles.practiceCard]}>
            <Text style={styles.cardTitle}>Practice Question</Text>
            <MarkdownWithMath
              content={similarQuestions.similar_question}
              style={styles.questionText}
            />
            <TouchableOpacity
              style={styles.solveButton}
              onPress={() => handleSolveQuestion(similarQuestions)}
            >
              <Text style={styles.solveButtonText}>Solve This Question</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Back to Dashboard Button */}
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={handleBackToDashboard}
        >
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  card: {
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
  practiceCard: {
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 12,
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
  conceptsContainer: {
    marginTop: 8,
  },
  conceptHeader: {
    marginVertical: 8,
  },
  conceptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  conceptPoint: {
    flexDirection: "row",
    marginVertical: 4,
    paddingLeft: 16,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#374151",
    marginRight: 8,
  },
  conceptText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  conceptParagraph: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginVertical: 4,
  },
  solveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  solveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dashboardButton: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
});

export default SimilarQuestionsScreen;