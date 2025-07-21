import React, { useState, useEffect, useContext } from "react";
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

const { width } = Dimensions.get("window");

const StudentDashScreen = () => {
  // Safe area insets with fallback for web
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (error) {
    // Fallback for web or when SafeAreaProvider is not available
    insets = {
      top: 0,
      bottom: Platform.OS === "web" ? 0 : 20,
      left: 0,
      right: 0,
    };
  }

  const navigation = useNavigation();
  const { username, logout } = useContext(AuthContext);
  const {
    currentLevel,
    currentXP,
    getProgressPercentage,
    dailyProgress,
    dailyGoal,
  } = useContext(ProgressContext);

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

      const questionsWithImages = (response.data.questions || []).map(
        (question, index) => ({
          ...question,
          id: index,
          question: question.question,
          image: question.question_image
            ? `data:image/png;base64,${question.question_image}`
            : null,
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        {/* Profile Button */}
        <View style={styles.topBar}>
          <View style={styles.spacer} />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileSidebar(true)}
          >
            <Ionicons name="person-circle" size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <GreetingHeader username={username} />

        {/* <View style={styles.statsContainer}>
          <ProgressCard
            title="Level"
            value={currentLevel}
            icon="trending-up"
            progress={getProgressPercentage()}
          />
          <ProgressCard
            title="XP"
            value={currentXP}
            icon="star"
            progress={getProgressPercentage()}
          />
          <ProgressCard
            title="Daily Goal"
            value={`${dailyProgress}/${dailyGoal}`}
            icon="checkmark-circle"
            progress={(dailyProgress / dailyGoal) * 100}
          />
        </View> */}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        {/* <QuickActions navigation={navigation} /> */}

        {/* Question Generator Form */}
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

        {/* Recent Sessions */}
        <RecentSessions />
      </ScrollView>

      {/* Profile Sidebar */}
      <ProfileSidebar
        visible={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  spacer: {
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
});

export default StudentDashScreen;
