import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { ProgressContext } from "../contexts/ProgressContext";
import { TimerContext } from "../contexts/TimerContext";
import axiosInstance from "../api/axiosInstance";
import { soundManager } from "../utils/SoundManager";

// Import components
import QuestionDisplay from "../components/QuestionDisplay";
import CameraCapture from "../components/CameraCapture";

const { width, height } = Dimensions.get("window");

import KeyboardAwareScreen from '../components/KeyboardAwareScreen';

const SolveQuestionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = useContext(AuthContext);
  const { completeQuestion, updateStudySession } = useContext(ProgressContext);
  const { startTimer, stopTimer, time, formatTime } = useContext(TimerContext);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const {
    questionList = [],
    class_id,
    subject_id,
    topic_ids,
    subtopic = "",
    worksheet_id = "",
    questionType,
  } = route.params || {};

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [processingButton, setProcessingButton] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [studyTime, setStudyTime] = useState(0);

  const currentQuestion = questionList[currentQuestionIndex];

  useEffect(() => {
    if (questionList.length > 0) {
      startTimer();
      // Start animations
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
      ]).start();
    }
    return () => {
      const timeSpent = stopTimer();
      console.log(`Study session ended. Time spent: ${timeSpent}ms`);
    };
  }, []);

  // Reset processing state when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setProcessingButton(null);
      setUploadProgress(0);
      setError(null);
    });
    return unsubscribe;
  }, [navigation]);

  // Helper function to convert URI to base64
  const convertToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  };

  // Helper function to prepare image for upload
  const prepareImageForUpload = (imageUri) => {
    if (Platform.OS === 'web') {
      return {
        uri: imageUri,
        type: 'image/jpeg',
        name: `solution-${Date.now()}.jpg`,
      };
    } else {
      return {
        uri: imageUri,
        type: 'image/jpeg',
        name: `solution-${Date.now()}.jpg`,
      };
    }
  };

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Enhanced submit handler
  const handleSubmitAnswer = () => {
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);
    
    sendFormData({
      submit: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "submit");
  };

  // Solve handler
  const handleSolve = () => {
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);
    
    sendFormData({
      solve: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes,

    }, "solve");
  };

  // Explain handler
  const handleExplain = () => {
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 1000);
    
    sendFormData({
      explain: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "explain");
  };

  // Correct handler
// Replace the existing handleCorrect function with this updated version

const handleCorrect = async () => {
  if (capturedImages.length === 0) {
    Alert.alert("Error", "Please capture at least one image of your solution.");
    return;
  }
  
  console.log("Starting handleCorrect function");
  setProcessingButton("correct");
  setError(null);
  const timeSpentMs = stopTimer();
  const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);

  try {
    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);
    formData.append("question", currentQuestion.question);
    formData.append("question_id", currentQuestion.question_id);
    formData.append("subtopic", subtopic);
    formData.append("correct", "true");
    formData.append("study_time_seconds", Math.floor(timeSpentMs / 1000).toString());
    formData.append("study_time_minutes", timeSpentMinutes.toString());

    console.log("FormData prepared", formData);

    // Convert captured images to proper format
    for (let i = 0; i < capturedImages.length; i++) {
      const imageUri = capturedImages[i];
      
      if (Platform.OS === 'web') {
        // Web platform handling
        if (imageUri.startsWith('data:')) {
          const base64 = imageUri.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          formData.append("ans_img", blob, `solution-${Date.now()}-${i}.jpg`);
        } else {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append("ans_img", blob, `solution-${Date.now()}-${i}.jpg`);
        }
      } else {
        // Native platform handling - use proper object structure
        formData.append("ans_img", {
          uri: imageUri,
          type: 'image/jpeg',
          name: `solution-${Date.now()}-${i}.jpg`,
        });
      }
    }

    // Handle question image
    if (currentQuestion.image) {
      if (currentQuestion.image.startsWith("data:image")) {
        // Extract base64 part if it's a data URI
        const base64Image = currentQuestion.image.split(',')[1] || currentQuestion.image;
        formData.append("ques_img", base64Image);
      } else if (currentQuestion.image.startsWith("http")) {
        try {
          const imageResponse = await fetch(currentQuestion.image);
          const blob = await imageResponse.blob();
          const reader = new FileReader();
          
          const base64String = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          const base64Image = base64String.split(',')[1];
          formData.append("ques_img", base64Image);
        } catch (fetchError) {
          console.error("Error fetching question image:", fetchError);
        }
      }
    }

    // Use the uploadFile helper instead of direct post
    setUploadProgress(0);
    const response = await axiosInstance.uploadFile(
      "/anssubmit/",
      formData,
      handleUploadProgress
    );

    console.log("API Response:", response.data);
    
    // Reset processing state before navigation
    setProcessingButton(null);
    setUploadProgress(0);

    // Navigate to result page
    navigation.navigate("Result", {
      message: response.data.message,
      ai_data: response.data.ai_data || response.data,
      actionType: "correct",
      questionList,
      class_id,
      subject_id,
      topic_ids,
      subtopic,
      questionImage: currentQuestion.image,
      questionNumber: currentQuestionIndex + 1,
      studentImages: capturedImages,
      question: currentQuestion.question,
      userAnswer: userAnswer
    });

    await soundManager.playCorrectAnswer();
  } catch (error) {
    console.error("API Error:", error);
    if (error.message?.includes("timed out")) {
      setError("Request timed out. Please try with a smaller image or check your connection.");
    } else if (error.response?.data?.error) {
      setError(error.response.data.error);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError("Failed to correct the solution. Please try again.");
    }
    setProcessingButton(null);
    setUploadProgress(0);
    
    // Restart timer since submission failed
    startTimer();
  }
};

  // Generic form data sender
// Replace the existing sendFormData function with this updated version

const sendFormData = async (flags = {}, actionType) => {
  setProcessingButton(actionType);
  setError(null);
  
  if (!currentQuestion) {
    setError("No question available");
    setProcessingButton(null);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);
    formData.append("question", currentQuestion.question);
    formData.append("subtopic", subtopic);
    formData.append("question_id", currentQuestion.question_id);

    // Add user answer if provided
    if (userAnswer.trim()) {
      formData.append("user_answer", userAnswer);
    }

    // Add all flags
    Object.entries(flags).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    // Add images if required by the action
    if (flags.submit && capturedImages.length > 0) {
      for (let i = 0; i < capturedImages.length; i++) {
        const imageUri = capturedImages[i];
        
        if (Platform.OS === 'web') {
          // Web platform handling
          if (imageUri.startsWith('data:')) {
            const base64 = imageUri.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            formData.append("ans_img", blob, `solution-${Date.now()}-${i}.jpg`);
          } else {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            formData.append("ans_img", blob, `solution-${Date.now()}-${i}.jpg`);
          }
        } else {
          // Native platform handling
          formData.append("ans_img", {
            uri: imageUri,
            type: 'image/jpeg',
            name: `solution-${Date.now()}-${i}.jpg`,
          });
        }
      }
    }

    // Add question image if available
    if (currentQuestion.image) {
      if (currentQuestion.image.startsWith("data:image")) {
        // Extract base64 part
        const base64Image = currentQuestion.image.split(',')[1] || currentQuestion.image;
        formData.append("ques_img", base64Image);
      } else if (currentQuestion.image.startsWith("http")) {
        try {
          const imageResponse = await fetch(currentQuestion.image);
          const blob = await imageResponse.blob();
          const reader = new FileReader();
          
          const base64String = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          const base64Image = base64String.split(',')[1];
          formData.append("ques_img", base64Image);
        } catch (fetchError) {
          console.error("Error fetching question image:", fetchError);
          formData.append("question_img_base64", currentQuestion.image);
        }
      }
    }

    // Use uploadFile helper instead of direct post
    const response = await axiosInstance.uploadFile(
      "/anssubmit/",
      formData,
      (flags.submit && capturedImages.length > 0) ? handleUploadProgress : undefined
    );

    console.log("API Response:", response.data);

    // Reset processing state before navigation
    setProcessingButton(null);
    setUploadProgress(0);

    // Update study session with time info if available
    if (flags.study_time_minutes) {
      updateStudySession(
        new Date().toISOString().split("T")[0],
        flags.study_time_minutes,
        1,
        0
      );
    }

    // Navigate to results page
    navigation.navigate("Result", {
      message: response.data.message,
      ai_data: response.data.ai_data || response.data,
      actionType,
      questionList,
      class_id,
      subject_id,
      topic_ids,
      subtopic,
      questionImage: currentQuestion.image,
      questionNumber: currentQuestionIndex + 1,
      studentImages: capturedImages,
      question: currentQuestion.question,
      userAnswer: userAnswer
    });

    // Play appropriate sound
    if (actionType === 'correct' || actionType === 'submit') {
      await soundManager.playCorrectAnswer();
    }
  } catch (error) {
    console.error("API Error:", error);
    
    if (error.message?.includes("timed out")) {
      setError("Request timed out. Please try with a smaller image or check your connection.");
    } else if (error.response?.data?.error) {
      setError(error.response.data.error);
    } else if (error.message) {
      setError(error.message);
    } else {
      setError("Failed to perform the action. Please try again.");
    }
    setProcessingButton(null);
    setUploadProgress(0);
    
    // Restart timer since submission failed
    startTimer();
  }
};

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionList.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswer("");
      setCapturedImages([]);
      setShowHint(false);
      setError(null);
      
      // Restart timer for new question
      stopTimer();
      startTimer();
    } else {
      // No more questions
      Alert.alert(
        "Congratulations!",
        "You have completed all questions in this set.",
        [
          {
            text: "Done",
            onPress: () =>
              navigation.navigate('StudentTabs', { screen: 'Dashboard' }),
          },
        ],
      );
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setUserAnswer("");
      setCapturedImages([]);
      setShowHint(false);
      setError(null);
      
      // Restart timer for previous question
      stopTimer();
      startTimer();
    }
  };

  const handleCameraCapture = (imageUri) => {
    setCapturedImages(prev => [...prev, imageUri]);
    setShowCamera(false);
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Determine if a specific button is processing
  const isButtonProcessing = (buttonType) => {
    return processingButton === buttonType;
  };

  // Determine if any button is processing (to disable all buttons)
  const isAnyButtonProcessing = () => {
    return processingButton !== null;
  };

  if (!currentQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No questions available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentContainerStyle={{ paddingHorizontal: 0 }}>
      <View style={[styles.container]}>
      {/* Header */}
      <LinearGradient 
        colors={["#3B82F6", "#6366F1", "#8B5CF6"]} 
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("StudentTabs")}
            disabled={isAnyButtonProcessing()}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Question {currentQuestionIndex + 1} of {questionList.length}
            </Text>
            <Text style={styles.headerSubtitle}>Time: {formatTime(time)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleHint}
            disabled={isAnyButtonProcessing()}
          >
            <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / questionList.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Upload Progress */}
      {isAnyButtonProcessing() && uploadProgress > 0 && (
        <View style={styles.uploadProgress}>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
            />
          </View>
          <Text style={styles.uploadProgressText}>
            Processing... {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Question Content */}
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
        >
          <QuestionDisplay question={currentQuestion} showHint={showHint} />
          
          {/* Answer Input Section */}
          <View style={styles.answerSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Your Answer</Text>
            </View>
            <TextInput
              style={styles.answerInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer here..."
              multiline
              numberOfLines={4}
              editable={!isAnyButtonProcessing()}
              placeholderTextColor="#9CA3AF"
            />
            
            {/* Camera Option */}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(true)}
              disabled={isAnyButtonProcessing()}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color="#3B82F6" />
              <Text style={styles.cameraButtonText}>
                {capturedImages.length > 0
                  ? `${capturedImages.length} Image(s) Captured`
                  : "Capture Solution Image"}
              </Text>
            </TouchableOpacity>
            
            {/* Captured Images Display */}
            {capturedImages.length > 0 && (
              <View style={styles.capturedImagesContainer}>
                <Text style={styles.capturedImagesTitle}>
                  Solution Images ({capturedImages.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {capturedImages.map((imageUri, index) => (
                    <View key={index} style={styles.capturedImageWrapper}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.capturedImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                        disabled={isAnyButtonProcessing()}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
        {/* Navigation Row */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              currentQuestionIndex === 0 && styles.disabledButton,
            ]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || isAnyButtonProcessing()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back-outline" size={20} color="#3B82F6" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNextQuestion}
            disabled={isAnyButtonProcessing()}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.solveButton]}
            onPress={handleSolve}
            disabled={isAnyButtonProcessing()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.actionButtonGradient}
            >
              {isButtonProcessing("solve") ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="bulb-outline" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Solve</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.explainButton]}
            onPress={handleExplain}
            disabled={isAnyButtonProcessing()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              style={styles.actionButtonGradient}
            >
              {isButtonProcessing("explain") ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="help-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Explain</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Secondary Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
        <TouchableOpacity
            style={[
              styles.actionButton,
              styles.correctButton,
              capturedImages.length === 0 && styles.disabledButton
            ]}
            onPress={handleCorrect}
            disabled={capturedImages.length === 0 || isAnyButtonProcessing()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.actionButtonGradient}
            >
              {isButtonProcessing("correct") ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Auto-Correct</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={[
              styles.actionButton,
              styles.submitButton,
              (userAnswer.trim() === "" && capturedImages.length === 0) && styles.disabledButton
            ]}
            onPress={handleSubmitAnswer}
            disabled={(userAnswer.trim() === "" && capturedImages.length === 0) || isAnyButtonProcessing()}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              style={styles.actionButtonGradient}
            >
              {isButtonProcessing("submit") ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Submit</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          visible={showCamera}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </View>
    </KeyboardAwareScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:0,
    margin:0,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerInfo: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  uploadProgress: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  uploadProgressText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  answerSection: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
  answerInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
  },
  cameraButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  capturedImagesContainer: {
    marginTop: 16,
  },
  capturedImagesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  capturedImageWrapper: {
    marginRight: 12,
    position: "relative",
  },
  capturedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomActions: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  navButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 6,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    flexDirection: "row",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SolveQuestionScreen;
