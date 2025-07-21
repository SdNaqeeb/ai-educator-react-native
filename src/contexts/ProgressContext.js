import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Storage utility that works on both native and web
const storage = {
  async getItem(key) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async setItem(key, value) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentXP, setCurrentXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [chaptersCompleted, setChaptersCompleted] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({});
  const [achievementStats, setAchievementStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: [],
  });

  // XP thresholds for levels
  const xpThresholds = [
    0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200,
    5950, 6750, 7600, 8500, 9450, 10450, 11500,
  ];

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const storedLevel = await storage.getItem("currentLevel");
      const storedXP = await storage.getItem("currentXP");
      const storedTotalXP = await storage.getItem("totalXP");
      const storedQuestionsCompleted =
        await storage.getItem("questionsCompleted");
      const storedChaptersCompleted =
        await storage.getItem("chaptersCompleted");
      const storedDailyGoal = await storage.getItem("dailyGoal");
      const storedDailyProgress = await storage.getItem("dailyProgress");

      if (storedLevel) setCurrentLevel(parseInt(storedLevel));
      if (storedXP) setCurrentXP(parseInt(storedXP));
      if (storedTotalXP) setTotalXP(parseInt(storedTotalXP));
      if (storedQuestionsCompleted)
        setQuestionsCompleted(parseInt(storedQuestionsCompleted));
      if (storedChaptersCompleted)
        setChaptersCompleted(JSON.parse(storedChaptersCompleted));
      if (storedDailyGoal) setDailyGoal(parseInt(storedDailyGoal));
      if (storedDailyProgress) setDailyProgress(parseInt(storedDailyProgress));
    } catch (error) {
      console.error("Error loading progress data:", error);
    }
  };

  const saveProgressData = async () => {
    try {
      await storage.setItem("currentLevel", currentLevel.toString());
      await storage.setItem("currentXP", currentXP.toString());
      await storage.setItem("totalXP", totalXP.toString());
      await storage.setItem(
        "questionsCompleted",
        questionsCompleted.toString(),
      );
      await storage.setItem(
        "chaptersCompleted",
        JSON.stringify(chaptersCompleted),
      );
      await storage.setItem("dailyGoal", dailyGoal.toString());
      await storage.setItem("dailyProgress", dailyProgress.toString());
    } catch (error) {
      console.error("Error saving progress data:", error);
    }
  };

  const addXP = (xpAmount) => {
    const newCurrentXP = currentXP + xpAmount;
    const newTotalXP = totalXP + xpAmount;

    setCurrentXP(newCurrentXP);
    setTotalXP(newTotalXP);

    // Check for level up
    const nextLevelThreshold =
      xpThresholds[currentLevel] || xpThresholds[xpThresholds.length - 1];
    if (
      newCurrentXP >= nextLevelThreshold &&
      currentLevel < xpThresholds.length - 1
    ) {
      levelUp();
    }

    saveProgressData();
  };

  const levelUp = () => {
    const newLevel = currentLevel + 1;
    const previousThreshold = xpThresholds[currentLevel - 1] || 0;
    const newCurrentXP = currentXP - previousThreshold;

    setCurrentLevel(newLevel);
    setCurrentXP(newCurrentXP);

    // Trigger level up notification or celebration
    console.log(`Level up! Now at level ${newLevel}`);
  };

  const completeQuestion = (xpReward = 10) => {
    setQuestionsCompleted((prev) => prev + 1);
    setDailyProgress((prev) => Math.min(prev + 1, dailyGoal));
    addXP(xpReward);
  };

  const completeChapter = (chapterId, xpReward = 50) => {
    if (!chaptersCompleted.includes(chapterId)) {
      setChaptersCompleted((prev) => [...prev, chapterId]);
      addXP(xpReward);
    }
  };

  const updateDailyGoal = (newGoal) => {
    setDailyGoal(newGoal);
    saveProgressData();
  };

  const resetDailyProgress = () => {
    setDailyProgress(0);
    saveProgressData();
  };

  const getProgressPercentage = () => {
    const currentThreshold = xpThresholds[currentLevel - 1] || 0;
    const nextThreshold =
      xpThresholds[currentLevel] || xpThresholds[xpThresholds.length - 1];
    const progressRange = nextThreshold - currentThreshold;

    if (progressRange === 0) return 100;

    return Math.min((currentXP / progressRange) * 100, 100);
  };

  const getDailyProgressPercentage = () => {
    return (dailyProgress / dailyGoal) * 100;
  };

  const contextValue = {
    currentLevel,
    currentXP,
    totalXP,
    questionsCompleted,
    chaptersCompleted,
    dailyGoal,
    dailyProgress,
    weeklyStats,
    achievementStats,
    addXP,
    completeQuestion,
    completeChapter,
    updateDailyGoal,
    resetDailyProgress,
    getProgressPercentage,
    getDailyProgressPercentage,
    xpThresholds,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};
