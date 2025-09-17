import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Context
import { AuthContext } from "../contexts/AuthContext";

// Import navigation setter from axiosInstance
// (handled at the app root; no NavigationContainer here)

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

// Student Screens
import StudentDashScreen from "../screens/StudentDashScreen";
import SolveQuestionScreen from "../screens/SolveQuestionScreen";
import ResultScreen from "../screens/ResultScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import ProgressDashboardScreen from "../screens/ProgressDashboardScreen";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import QuestsScreen from "../screens/QuestsScreen";
import SimilarQuestionsScreen from "../screens/SimilarQuestionsScreen";
import HomeworkSubmissionScreen from "../screens/HomeworkSubmissionScreen";
import StudentGapAnalysisScreen from "../screens/StudentGapAnalysisScreen";
import WorksheetSubmissionScreen from "../screens/WorksheetSubmissionScreen";

// Teacher Screens
import TeacherDashScreen from "../screens/TeacherDashScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for Students
function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Analytics") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "Progress") {
            iconName = focused ? "trending-up" : "trending-up-outline";
          } else if (route.name === "Leaderboard") {
            iconName = focused ? "trophy" : "trophy-outline";
          } else if (route.name === "Quests") {
            iconName = focused ? "medal" : "medal-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#667eea",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Progress" component={ProgressDashboardScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
    </Tab.Navigator>
  );
}

// Main Tab Navigator for Teachers
function TeacherTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "TeacherDash") {
            iconName = focused ? "school" : "school-outline";
          } else if (route.name === "Analytics") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#667eea",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="TeacherDash" component={TeacherDashScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

// Private Route Wrapper
function PrivateNavigator() {
  const { user, role } = useContext(AuthContext);

  if (!user) {
    return null; // This shouldn't happen due to main navigator logic
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === "teacher" ? (
        <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
      ) : (
        <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
      )}
      <Stack.Screen name="SolveQuestion" component={SolveQuestionScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen
        name="SimilarQuestions"
        component={SimilarQuestionsScreen}
      />
      <Stack.Screen name="Homework" component={HomeworkSubmissionScreen} />
      <Stack.Screen name="GapAnalysis" component={StudentGapAnalysisScreen} />
      <Stack.Screen
        name="WorksheetSubmission"
        component={WorksheetSubmissionScreen}
      />
    </Stack.Navigator>
  );
}

// Main Navigator Component
function MainNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null; // Could add a loading screen here
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={PrivateNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Root Navigator (no NavigationContainer here; it's provided in app/App.js)
export default function RootNavigator() {
  return <MainNavigator />;
}