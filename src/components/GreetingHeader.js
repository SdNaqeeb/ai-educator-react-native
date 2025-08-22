import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GreetingHeader = ({ username }) => {
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 6) {
      return "Good Night";
    } else if (currentHour >= 6 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingContent}>
        <View style={styles.greetingText}>
          <Text style={styles.greetingTitle}>
            
            {getTimeBasedGreeting()}, {username}!
            <Text style={styles.emoji}> 🎓</Text>
          </Text>

          <View style={styles.motivationButtons}>
            <TouchableOpacity style={styles.motivationBtn}>
              <Ionicons name="star" size={12} color="#ffd700" />
              <Text style={styles.motivationBtnText}>Keep Going!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.motivationBtn}>
              <Ionicons name="trophy" size={12} color="#ffd700" />
              <Text style={styles.motivationBtnText}>You're Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.currentDate}>{getCurrentDate()}</Text>
          <Text style={styles.currentYear}>{new Date().getFullYear()}</Text>
        </View>
      </View>

      {/* Motivational Quote */}
      {/* <View style={styles.motivationalQuote}>
        <Ionicons
          name="sparkles"
          size={16}
          color="#ffd700"
          style={styles.quoteIcon}
        />
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>
            "Mathematics is not about numbers, equations, or algorithms: it is
            about understanding!"
          </Text>
          <Text style={styles.quoteAuthor}>— William Paul Thurston</Text>
        </View>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greetingText: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 30,
  },
  icon: {
    marginRight: 8,
  },
  emoji: {
    fontSize: 24,
  },
  motivationButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  motivationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  motivationBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  dateSection: {
    alignItems: "flex-end",
  },
  currentDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "right",
  },
  currentYear: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  motivationalQuote: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  quoteIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 14,
    color: "#ffffff",
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 4,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
});

export default GreetingHeader;
