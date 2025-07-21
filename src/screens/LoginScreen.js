import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../api/axiosInstance";

const { width, height } = Dimensions.get("window");

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  // Animation values
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const circleAnimations = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
      // Animate background circles
      ...circleAnimations.map((animation, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 3000 + index * 500,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }
  
    setIsLoading(true);
  
    try {
      await axiosInstance.initializeCSRF(); // ✅ ensure token before login
      const response = await axiosInstance.post("/login/", {
        username: username.trim(),
        password: password.trim(),
      });
  
      const { token, role, class_name, csrf_token } = response.data;
  
      if (token && csrf_token) {
        await login(username.trim(), token, role || "student", class_name || "", csrf_token);
        console.log("✅ Login complete");
      } else {
        Alert.alert("Error", "Login failed. Missing token or CSRF.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      Alert.alert("Login Failed", error.response?.data?.description || "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const navigateToSignup = () => {
    navigation.navigate("Signup");
  };

  const renderBackgroundCircle = (index) => {
    const animation = circleAnimations[index];
    const size = 60 + index * 20;
    const left = (index * 60) % width;
    const top = (index * 80) % (height * 0.6);

    return (
      <Animated.View
        key={index}
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            left,
            top,
            opacity: animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.1, 0.3, 0.1],
            }),
            transform: [
              {
                scale: animation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 1.2, 0.8],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Circles */}
          {circleAnimations.map((_, index) => renderBackgroundCircle(index))}

          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoAnimation,
                transform: [
                  {
                    translateY: logoAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>AI EDUCATOR</Text>
              <Text style={styles.logoSubText}>Smart Learning Platform</Text>
            </View>

            <View style={styles.portalSection}>
              <View style={styles.portalIcons}>
                <Ionicons name="school" size={24} color="#ffffff" />
                <Ionicons name="book" size={24} color="#ffffff" />
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
              <Text style={styles.portalTitle}>Student Portal</Text>
              <Text style={styles.portalDescription}>
                Access your AI-powered learning experience
              </Text>
            </View>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: formAnimation,
                transform: [
                  {
                    translateY: formAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail" size={20} color="#667eea" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Student Email"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed" size={20} color="#667eea" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#667eea"
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                ) : (
                  <Text style={styles.loginButtonText}>Start Learning</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Form Footer */}
            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Reset Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Support</Text>
              </TouchableOpacity>
            </View>

            {/* Signup Link */}
            <TouchableOpacity
              style={styles.signupLinkContainer}
              onPress={navigateToSignup}
            >
              <Text style={styles.signupText}>
                Don't have an account?{" "}
                <Text style={styles.signupLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Copyright */}
          <Text style={styles.copyright}>
            © 2025 AI EDUCATOR. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backgroundCircle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  logoSubText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
    fontWeight: "500",
  },
  portalSection: {
    alignItems: "center",
  },
  portalIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: 120,
    marginBottom: 15,
  },
  portalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  portalDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  textInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "500",
  },
  passwordToggle: {
    paddingRight: 16,
    paddingLeft: 12,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  formFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
  },
  signupLinkContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signupText: {
    fontSize: 14,
    color: "#6b7280",
  },
  signupLink: {
    color: "#667eea",
    fontWeight: "bold",
  },
  copyright: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 20,
  },
});

export default LoginScreen;
