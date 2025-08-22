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
  const backgroundElements = useRef(
    Array.from({ length: 4 }, () => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
    }))
  ).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start main animations with smoother timing
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle background elements animation
    backgroundElements.forEach((element, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(element.translateY, {
            toValue: -15,
            duration: 3000 + (index * 500),
            useNativeDriver: true,
          }),
          Animated.timing(element.translateY, {
            toValue: 15,
            duration: 3000 + (index * 500),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(element.opacity, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(element.opacity, {
            toValue: 0.2,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Subtle logo breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.initializeCSRF();
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

  const renderBackgroundElement = (index) => {
    const element = backgroundElements[index];
    const positions = [
      { left: width * 0.1, top: height * 0.2 },
      { right: width * 0.15, top: height * 0.3 },
      { left: width * 0.05, top: height * 0.6 },
      { right: width * 0.1, top: height * 0.7 },
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
    <LinearGradient 
      colors={['#3B82F6', '#8B5CF6']} 
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subtle Background Elements */}
          {backgroundElements.map((_, index) => renderBackgroundElement(index))}

          {/* Decorative Background */}
          <View style={styles.backgroundDecoration}>
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
            <View style={[styles.decorativeCircle, styles.circle3]} />
          </View>

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
                      outputRange: [-30, 0],
                    }),
                  },
                  { scale: logoScale },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoIconContainer}>
                <LinearGradient
                  colors={['#60A5FA', '#A78BFA']}
                  style={styles.logoIconGradient}
                >
                  <Ionicons name="school-outline" size={36} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.logoText}>SMART LEARNERS</Text>
              <Text style={styles.logoSubText}>Intelligent Learning Platform</Text>
            </View>

            <View style={styles.portalSection}>
              <View style={styles.portalIcons}>
                <View style={styles.portalIcon}>
                  <Ionicons name="book-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.portalIcon}>
                  <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.portalIcon}>
                  <Ionicons name="trending-up-outline" size={18} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.portalTitle}>Student Portal</Text>
              <Text style={styles.portalDescription}>
                Access your personalized learning dashboard
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
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue your learning journey</Text>
            </View> */}

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#6366F1" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="User ID"
                placeholderTextColor="#94A3B8"
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
                <Ionicons name="lock-closed-outline" size={20} color="#6366F1" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
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
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6366F1"
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
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3B82F6', '#6366F1', '#8B5CF6']}
                locations={[0, 0.5, 1]}
                style={styles.loginButtonGradient}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? "Signing In..." : "Start Learning"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Additional Options */}
            {/* <View style={styles.formFooter}>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View> */}
          </Animated.View>

          {/* Copyright */}
          <Text style={styles.copyright}>
            © 2025 AI Educator. All rights reserved.
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -150,
    right: -150,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -100,
  },
  circle3: {
    width: 120,
    height: 120,
    top: height * 0.4,
    right: -60,
  },
  backgroundElement: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIconContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    
  },
  logoSubText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
   
  },
  portalSection: {
    alignItems: 'center',
  },
  portalIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  portalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  portalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  
  },
  portalDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
   
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
 
  },
  formSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  textInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  
  },
  passwordToggle: {
    paddingRight: 16,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
   
  },
  formFooter: {
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',

  },
  copyright: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 20,
 
  },
});

export default LoginScreen;