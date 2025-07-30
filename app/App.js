import React, {useState} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Context Providers
import { AuthProvider } from "../src/contexts/AuthContext";
import { NotificationProvider } from "../src/contexts/NotificationContext";
import { ProgressProvider } from "../src/contexts/ProgressContext";
import { LeaderboardProvider } from "../src/contexts/LeaderboardContext";
import { QuestProvider } from "../src/contexts/QuestContext";
import { CurrentQuestionProvider } from "../src/contexts/CurrentQuestionContext";
import { TutorialProvider } from "../src/contexts/TutorialContext";
import { TimerProvider } from "../src/contexts/TimerContext";

// Navigation
import RootNavigator from "../src/navigation/RootNavigator";

// Components
import ChatBox from "../src/components/ChatBox";

// Ignore specific warnings
LogBox.ignoreLogs([
  "Warning: AsyncStorage has been extracted from react-native",
  "Warning: componentWillReceiveProps has been renamed",
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <AuthProvider>
          <NotificationProvider>
            <ProgressProvider>
              <TimerProvider>
                <LeaderboardProvider>
                  <QuestProvider>
                    <TutorialProvider>
                      <CurrentQuestionProvider>
                        {/* <NavigationContainer> */}
                          <StatusBar style="auto" />
                          <RootNavigator />
                          <ChatBox />
                        {/* </NavigationContainer> */}
                      </CurrentQuestionProvider>
                    </TutorialProvider>
                  </QuestProvider>
                </LeaderboardProvider>
              </TimerProvider>
            </ProgressProvider>
          </NotificationProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
