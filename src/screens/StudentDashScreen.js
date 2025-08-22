import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { ProgressContext } from "../contexts/ProgressContext";
import axiosInstance from "../api/axiosInstance";

// Import custom components
import GreetingHeader from "../components/GreetingHeader";
import ProgressCard from "../components/ProgressCard";
import QuestionGeneratorForm from "../components/QuestionGeneratorForm";
import RecentSessions from "../components/RecentSessions";
import QuickActions from "../components/QuickActions";
import ProfileSidebar from "../components/ProfileSidebar";

const { width, height } = Dimensions.get("window");

const StudentDashScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { username, logout } = useContext(AuthContext);
  const {
    currentLevel,
    currentXP,
    getProgressPercentage,
    dailyProgress,
    dailyGoal,
  } = useContext(ProgressContext);

  // Animation values
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const backgroundElements = useRef(
    Array.from({ length: 3 }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0.2),
    }))
  ).current;

  // State for form data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionType, setQuestionType] = useState("");
  const [questionLevel, setQuestionLevel] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("");
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  useEffect(() => {
    fetchClasses();
    startAnimations();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject && selectedClass) {
      fetchChapters();
    }
  }, [selectedSubject, selectedClass]);

  useEffect(() => {
    if (
      questionType === "external" &&
      selectedClass &&
      selectedSubject &&
      selectedChapters.length > 0
    ) {
      fetchSubTopics();
    }
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  useEffect(() => {
    if (
      questionType === "worksheets" &&
      selectedClass &&
      selectedSubject &&
      selectedChapters.length > 0
    ) {
      fetchWorksheets();
    }
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  const startAnimations = () => {
    // Header animation
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Content animation
    Animated.timing(contentAnimation, {
      toValue: 1,
      duration: 1000,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Background elements animation
    backgroundElements.forEach((element, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(element.translateY, {
            toValue: -10,
            duration: 3000 + (index * 800),
            useNativeDriver: true,
          }),
          Animated.timing(element.translateY, {
            toValue: 10,
            duration: 3000 + (index * 800),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(element.opacity, {
            toValue: 0.4,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(element.opacity, {
            toValue: 0.1,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const extractClassFromUsername = (username) => {
    if (!username) return "";
    const classNumber = username.substring(0, 2);
    return isNaN(classNumber) ? "" : classNumber;
  };

  const fetchClasses = async () => {
    try {
      console.log("Fetching classes...");
      const response = await axiosInstance.get("/classes/");
      console.log("Classes API response:", response.data);
      const classesData = response.data.data || response.data;
      setClasses(classesData);
      // Auto-select class based on username
      const defaultClass = extractClassFromUsername(username);
      console.log("Username:", username, "Extracted class:", defaultClass);
      if (defaultClass) {
        const matchingClass = classesData.find(
          (cls) =>
            cls.class_name.includes(defaultClass) ||
            cls.class_code === defaultClass,
        );
        console.log("Matching class found:", matchingClass);
        if (matchingClass) {
          setSelectedClass(matchingClass.class_code);
          console.log("Auto-selected class:", matchingClass.class_code);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      console.error("Error details:", error.response?.data);
      if (error.response?.status === 403) {
        Alert.alert(
          "Permission Error",
          "You do not have permission to access classes. Please check your account settings.",
        );
      } else if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
      } else {
        Alert.alert("Error", "Failed to load classes. Please try again later.");
      }
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClass) {
      console.log("No class selected, skipping subject fetch");
      return;
    }
    try {
      console.log("Fetching subjects for class:", selectedClass);
      const response = await axiosInstance.post("/subjects/", {
        class_id: selectedClass,
      });
      console.log("Subjects API response:", response.data);
      const subjectsData = response.data.data || response.data;
      setSubjects(subjectsData);
      // Auto-select Math subject
      const mathSubject = subjectsData.find((subject) =>
        subject.subject_name.toLowerCase().includes("math"),
      );
      if (mathSubject) {
        setSelectedSubject(mathSubject.subject_code);
        console.log("Auto-selected Math subject:", mathSubject);
      }
      // Reset dependent fields
      setSelectedChapters([]);
      setQuestionType("");
      setQuestionLevel("");
      setSelectedWorksheet("");
    } catch (error) {
      console.error("Error fetching subjects:", error);
      console.error("Error details:", error.response?.data);
      // More user-friendly error handling
      if (error.response?.status === 403) {
        Alert.alert(
          "Permission Error",
          "You do not have permission to access subjects. Please check your account settings or contact support.",
        );
      } else if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load subjects. Please try again later.",
        );
      }
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await axiosInstance.post("/chapters/", {
        subject_id: selectedSubject,
        class_id: selectedClass,
      });
      if (response.data && response.data.data) {
        setChapters(response.data.data);
      } else {
        setChapters([]);
      }
      setSelectedChapters([]);
      setQuestionType("");
      setQuestionLevel("");
      setSelectedWorksheet("");
    } catch (error) {
      console.error("Error fetching chapters:", error);
      Alert.alert("Error", "Failed to load chapters");
    }
  };

  const fetchSubTopics = async () => {
    try {
      const response = await axiosInstance.post("/question-images/", {
        classid: selectedClass,
        subjectid: selectedSubject,
        topicid: selectedChapters[0],
        external: true,
      });
      setSubTopics(response.data.subtopics || []);
    } catch (error) {
      console.error("Error fetching subtopics:", error);
    }
  };

  const fetchWorksheets = async () => {
    try {
      const response = await axiosInstance.post("/question-images/", {
        classid: selectedClass,
        subjectid: selectedSubject,
        topicid: selectedChapters[0],
        worksheets: true,
      });
      setWorksheets(response.data.worksheets || []);
    } catch (error) {
      console.error("Error fetching worksheets:", error);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!isGenerateButtonEnabled()) {
      Alert.alert("Error", "Please select all required fields");
      return;
    }
    setLoading(true);
    const requestData = {
      classid: Number(selectedClass),
      subjectid: Number(selectedSubject),
      topicid: selectedChapters,
      solved: questionType === "solved",
      exercise: questionType === "exercise",
      subtopic: questionType === "external" ? questionLevel : null,
      worksheet_name: questionType === "worksheets" ? selectedWorksheet : null,
    };
    try {
      const response = await axiosInstance.post(
        "/question-images/",
        requestData,
      );

      console.log("generated questions:",response.data)
      const questionsWithImages = (response.data.questions || []).map(
        (question, index) => ({
          ...question,
          id: index,
          question: question.question,
          image: question.question_image
            ? `data:image/png;base64,${question.question_image}`
            : null,
            question_id:question.id
        }),
      );
      // Navigate to question selection or directly to solve question
      navigation.navigate("SolveQuestion", {
        questionList: questionsWithImages,
        class_id: selectedClass,
        subject_id: selectedSubject,
        topic_ids: selectedChapters,
        subtopic: questionType === "external" ? questionLevel : "",
        worksheet_id: questionType === "worksheets" ? selectedWorksheet : "",
        questionType,
      });
    } catch (error) {
      console.error("Error generating questions:", error);
      Alert.alert("Error", "Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isGenerateButtonEnabled = () => {
    if (questionType === "external") {
      return (
        selectedClass !== "" &&
        selectedSubject !== "" &&
        selectedChapters.length > 0 &&
        questionType !== "" &&
        questionLevel !== ""
      );
    }
    if (questionType === "worksheets") {
      return (
        selectedClass !== "" &&
        selectedSubject !== "" &&
        selectedChapters.length > 0 &&
        questionType !== "" &&
        selectedWorksheet !== ""
      );
    }
    return (
      selectedClass !== "" &&
      selectedSubject !== "" &&
      selectedChapters.length > 0 &&
      questionType !== ""
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const renderBackgroundElement = (index) => {
    const element = backgroundElements[index];
    const positions = [
      { left: width * 0.1, top: 60 },
      { right: width * 0.15, top: 100 },
      { left: width * 0.05, top: 140 },
    ];

    return (
      <Animated.View
        key={index}
        style={[
          styles.backgroundElement,
          positions[index],
          {
            opacity: element.opacity,
            transform: [{ translateY: element.translateY }],
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
       <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
      <LinearGradient
        colors={["#3B82F6", "#8B5CF6"]}
        locations={[0, 0.5, 1]}
        style={styles.headerGradient}
      >
        {/* Background Elements */}
        {backgroundElements.map((_, index) => renderBackgroundElement(index))}

        {/* Decorative Background */}
        <View style={styles.backgroundDecoration}>
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />
        </View>

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerAnimation,
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Profile Button */}
          <View style={styles.topBar}>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowProfileSidebar(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.profileButtonGradient}
              >
                <Ionicons name="person-circle-outline" size={28} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <GreetingHeader username={username} />

          {/* Progress Stats - Uncomment if needed */}
          {/* <View style={styles.statsContainer}>
            <ProgressCard
              title="Level"
              value={currentLevel}
              icon="trending-up-outline"
              progress={getProgressPercentage()}
            />
            <ProgressCard
              title="XP"
              value={currentXP}
              icon="star-outline"
              progress={getProgressPercentage()}
            />
            <ProgressCard
              title="Daily Goal"
              value={`${dailyProgress}/${dailyGoal}`}
              icon="checkmark-circle-outline"
              progress={(dailyProgress / dailyGoal) * 100}
            />
          </View> */}
        </Animated.View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: contentAnimation,
            transform: [
              {
                translateY: contentAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
       
          {/* Quick Actions - Uncomment if needed */}
          {/* <QuickActions navigation={navigation} /> */}

          {/* Question Generator Form */}
          <View style={styles.formContainer}>
            <QuestionGeneratorForm
              classes={classes}
              subjects={subjects}
              chapters={chapters}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              selectedChapters={selectedChapters}
              setSelectedChapters={setSelectedChapters}
              questionType={questionType}
              setQuestionType={setQuestionType}
              questionLevel={questionLevel}
              setQuestionLevel={setQuestionLevel}
              selectedWorksheet={selectedWorksheet}
              setSelectedWorksheet={setSelectedWorksheet}
              subTopics={subTopics}
              worksheets={worksheets}
              onGenerate={handleGenerateQuestions}
              isEnabled={isGenerateButtonEnabled()}
              loading={loading}
            />
          </View>

          {/* Recent Sessions */}
          <View style={styles.sessionsContainer}>
            <RecentSessions />
          </View>
      
      </Animated.View>

      {/* Profile Sidebar */}
      <ProfileSidebar
        visible={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
      />
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  backgroundElement: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 10,
  },
  spacer: {
    flex: 1,
  },
  profileButton: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingBottom: 15,
    paddingTop: 10,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sessionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
});

export default StudentDashScreen;