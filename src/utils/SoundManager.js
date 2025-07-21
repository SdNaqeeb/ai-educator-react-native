import { Audio } from "expo-av";
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

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.isSoundEnabled = true;
    this.volume = 0.5;
    this.isInitialized = false;
    this.soundAssets = {
      "achievement-unlocked": require("../../assets/sounds/achievement-unlocked.mp3"),
      "chapter-completed": require("../../assets/sounds/chapter-completed.mp3"),
      "correct-answer": require("../../assets/sounds/correct-answer.mp3"),
      "level-up": require("../../assets/sounds/level-up.mp3"),
      "question-solved": require("../../assets/sounds/question-solved.mp3"),
      "streak-bonus": require("../../assets/sounds/streak-bonus.mp3"),
      "top-rank": require("../../assets/sounds/top-rank.mp3"),
      "wrong-answer": require("../../assets/sounds/wrong-answer.mp3"),
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for the app
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load sound preferences
      await this.loadPreferences();

      // Preload sounds
      await this.preloadSounds();

      this.isInitialized = true;
      console.log("SoundManager initialized successfully");
    } catch (error) {
      console.error("Error initializing SoundManager:", error);
    }
  }

  async preloadSounds() {
    try {
      const loadPromises = Object.entries(this.soundAssets).map(
        async ([key, asset]) => {
          try {
            const { sound } = await Audio.Sound.createAsync(asset, {
              shouldPlay: false,
              volume: this.volume,
            });
            this.sounds.set(key, sound);
          } catch (error) {
            console.error(`Error loading sound ${key}:`, error);
          }
        },
      );

      await Promise.all(loadPromises);
      console.log(`Preloaded ${this.sounds.size} sounds`);
    } catch (error) {
      console.error("Error preloading sounds:", error);
    }
  }

  async loadPreferences() {
    try {
      const soundEnabled = await storage.getItem("soundEnabled");
      const soundVolume = await storage.getItem("soundVolume");

      this.isSoundEnabled = soundEnabled !== "false"; // Default to true
      this.volume = soundVolume ? parseFloat(soundVolume) : 0.5;
    } catch (error) {
      console.error("Error loading sound preferences:", error);
    }
  }

  async savePreferences() {
    try {
      await storage.setItem("soundEnabled", this.isSoundEnabled.toString());
      await storage.setItem("soundVolume", this.volume.toString());
    } catch (error) {
      console.error("Error saving sound preferences:", error);
    }
  }

  async playSound(soundName) {
    if (!this.isSoundEnabled || !this.isInitialized) return;

    try {
      const sound = this.sounds.get(soundName);
      if (sound) {
        await sound.setVolumeAsync(this.volume);
        await sound.replayAsync();
      } else {
        console.warn(`Sound ${soundName} not found`);
      }
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    await this.savePreferences();

    // Update volume for all loaded sounds
    for (const sound of this.sounds.values()) {
      try {
        await sound.setVolumeAsync(this.volume);
      } catch (error) {
        console.error("Error updating sound volume:", error);
      }
    }
  }

  async setSoundEnabled(enabled) {
    this.isSoundEnabled = enabled;
    await this.savePreferences();
  }

  async cleanup() {
    try {
      for (const sound of this.sounds.values()) {
        await sound.unloadAsync();
      }
      this.sounds.clear();
      this.isInitialized = false;
    } catch (error) {
      console.error("Error cleaning up sounds:", error);
    }
  }

  // Convenience methods for specific game events
  async playCorrectAnswer() {
    await this.playSound("correct-answer");
  }

  async playWrongAnswer() {
    await this.playSound("wrong-answer");
  }

  async playAchievementUnlocked() {
    await this.playSound("achievement-unlocked");
  }

  async playLevelUp() {
    await this.playSound("level-up");
  }

  async playChapterCompleted() {
    await this.playSound("chapter-completed");
  }

  async playQuestionSolved() {
    await this.playSound("question-solved");
  }

  async playStreakBonus() {
    await this.playSound("streak-bonus");
  }

  async playTopRank() {
    await this.playSound("top-rank");
  }
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Auto-initialize when the module is loaded
soundManager.initialize().catch(console.error);

export default soundManager;
