"use client"

import { useState, useRef, useEffect, useContext, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Modal from "react-native-modal"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import { Audio } from "expo-av"
import * as Speech from "expo-speech"
import { AuthContext } from "../contexts/AuthContext"
import CameraCapture from "../components/CameraCapture"
import { BlurView } from 'expo-blur'
import axios from "axios"
import axiosInstance from "../api/axiosInstance"

const { width, height } = Dimensions.get("window")

const ChatBox = () => {
  const { user, username, className } = useContext(AuthContext)
  const insets = useSafeAreaInsets()

  // Basic State
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [studentInfo, setStudentInfo] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Voice States
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUri, setAudioUri] = useState(null)

  // Image States
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [previewImageUri, setPreviewImageUri] = useState(null)

  // UI States
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isAudioPaused, setIsAudioPaused] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("checking")

  // Refs
  const messagesEndRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const messageCounter = useRef(0)
  const hasInitialized = useRef(false)
  const isCreatingSession = useRef(false)
  const scrollViewRef = useRef(null)
  const previousAuthKeyRef = useRef(null)

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  // API URL
  const API_URL = "https://chatbot.smartlearners.ai"

  // Languages
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "te", name: "Telugu", flag: "🇮🇳" },
  ]

  // ====== Fetch Student Data Function ======
  const fetchStudentData = async () => {
    if (!username) return

    try {
      console.log("Fetching student data for:", username)
      const response = await axiosInstance.post("dummy/", {
        homework: "true",
        agentic_data: "true",
      })
      
      console.log("✅ Student Data Response:", response.data)
      
      if (response.data && response.data[username]) {
        console.log("📦 Student data found for", username, ":", response.data[username])
        setStudentInfo(response.data[username])
        return response.data[username]
      } else {
        console.warn("⚠ No student data found for", username)
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching student data:", error)
      return null
    }
  }

  // ====== Helper function to prepare student context ======
  const prepareStudentContext = () => studentInfo

  // Extract student ID from username (assuming username format includes student ID)
  const getStudentId = useCallback(() => {
    // If username is the student ID directly
    if (username && /^\d{6,}$/.test(username)) {
      return username
    }
    // If username contains student ID (adjust based on your actual format)
    // For example: "john_doe_101234" -> "101234"
    const match = username?.match(/(\d{6,})/)
    return match ? match[1] : `10${Date.now().toString().slice(-4)}` // Default fallback
  }, [username])

  // Fetch student data when username changes
  useEffect(() => {
    if (username) {
      fetchStudentData()
        .then((data) => {
          if (data && data[username]) {
            const filteredData = data[username];
            setStudentInfo(filteredData);
  
            // 🔥 Combine username + filteredData into one payload
            const payload = {
              username: username,
              student_info: JSON.stringify(filteredData)
            };
  
            axiosInstance.post("fetch-data/", payload)
              .then((res) => {
                console.log("✅ Sent username + filtered data:", res.data);
              })
              .catch((err) => {
                console.error("❌ Error sending data:", err);
              });
  
          } else {
            console.warn("⚠️ No student data found for", username);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to fetch dummy data:", err);
        });
    }
  }, [username]);

  // Initialize or refresh session on login or class change
  useEffect(() => {
    if (!user || !username) {
      setSessionId(null)
      setStudentInfo(null)
      setMessages([])
      return
    }

    const authKey = `${username}|${user?.student_class || ""}`

    if (previousAuthKeyRef.current === authKey && sessionId) {
      return
    }

    previousAuthKeyRef.current = authKey

    const resetAndCreate = async () => {
      try {
        setError(null)
        if (sessionId) {
          await fetch(`${API_URL}/clear-session/${sessionId}`, { method: "DELETE" }).catch(() => {})
        }
      } finally {
        setMessages([])
        setSessionId(null)
        setStudentInfo(null)
        hasInitialized.current = true
        isCreatingSession.current = true
        createSession()
      }
    }

    resetAndCreate()
  }, [user, username, user?.student_class])

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isRecording, pulseAnim])

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0 && connectionStatus === "connected") {
      addMessage({
        text: "👋 Hi! I'm your Math Assistant. Ask a doubt, upload a problem image, or use voice.",
        sender: "ai",
        canSpeak: true,
      })
    }
  }, [connectionStatus])

  // Create session with student ID
  const createSession = async () => {
    if (sessionId || isLoading) {
      console.log("Session already exists or creating, skipping...")
      return
    }
    
    setIsLoading(true)
    setConnectionStatus("checking")

    try {
      const studentId = username
      console.log("Creating session with student ID:", studentId)

      const formData = new FormData()
      formData.append("student_id", studentId)

      const response = await fetch(`${API_URL}/create_session`, {
        method: "POST",
        body: formData,
      })

      console.log("Session creation response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Session creation error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Session creation response data:", data)

      if (data.session_id) {
        setSessionId(data.session_id)
        setConnectionStatus("connected")
        console.log("Session created successfully:", data.session_id)

        // Fetch student data after session creation
        await fetchStudentData()

        // Check if student data exists in response
        if (data[username]) {
          console.log("Session response contains student data:", data[username])
          setStudentInfo(data[username])
        }

        // Fetch initial messages from session
        fetchSessionData(data.session_id)
      } else {
        throw new Error("No session ID received from server")
      }
    } catch (error) {
      console.error("Session creation error:", error)
      setError(`Failed to start chat: ${error.message}`)
      setConnectionStatus("disconnected")

      setMessages([{
        id: "error_single",
        text: `⚠ Connection failed. Please refresh or try again later.`,
        sender: "ai",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
      isCreatingSession.current = false
    }
  }

  // Fetch session data including messages
  const fetchSessionData = async (sessionIdParam) => {
    try {
      const response = await fetch(`${API_URL}/session/${sessionIdParam}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.student_info) {
          setStudentInfo(data.student_info)
        }
        
        // Convert backend messages to frontend format
        const formattedMessages = data.messages.map((msg, index) => ({
          id: `msg_${index}_${Date.now()}`,
          text: msg.content,
          sender: msg.role === "assistant" ? "ai" : "user",
          timestamp: new Date(),
          canSpeak: msg.role === "assistant",
        }))
        
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Error fetching session data:", error)
    }
  }

  // Add message function
  const addMessage = (message) => {
    messageCounter.current += 1
    const newMsg = {
      id: `msg_${Date.now()}_${messageCounter.current}`,
      timestamp: new Date(),
      ...message,
    }

    setMessages((prev) => [...prev, newMsg])
  }

  // Send text message (updated for new backend with student context)
  const sendTextMessage = async () => {
    if (!newMessage.trim() || !sessionId) return

    addMessage({ text: newMessage, sender: "user" })
    const messageText = newMessage
    setNewMessage("")
    setIsLoading(true)

    try {
      // Prepare student context
      const studentContext = prepareStudentContext()
      const tailoredMessage=messageText
      
      // Check if we have an image to send with the message
      if (selectedImage && imagePreview) {
        // Use the main chat endpoint with image
        const formData = new FormData()
        formData.append("session_id", sessionId)
        formData.append("query", messageText)
        formData.append("language", currentLanguage)
        formData.append("image", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: `image_${Date.now()}.jpg`,
        })
        
        // Add student context if available
        if (studentContext) {
          formData.append("student_context", JSON.stringify(studentContext))
        }

        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        addMessage({
          text: data.reply || "I received your message!",
          sender: "ai",
          canSpeak: true,
          audio: data.audio,
        })

        // Clear image after sending
        setSelectedImage(null)
        setImagePreview(null)
      } else {
        // Use simple text endpoint
        const requestBody = {
          query: messageText ,
          session_id: sessionId,
          language: currentLanguage,
        }
        
        // Add student context
        if (studentContext) {
          requestBody.student_context = studentContext
        }

        const response = await fetch(`${API_URL}/chat-simple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        addMessage({
          text: data.reply || "I received your message!",
          sender: "ai",
          canSpeak: true,
          audio: data.audio,
        })
      }
    } catch (error) {
      console.error("Text message error:", error)
      addMessage({
        text: `Sorry, I couldn't process your message. Error: ${error.message}`,
        sender: "ai",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      console.log("Requesting permissions..")
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      console.log("Starting recording..")
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      console.log("Recording started")
    } catch (err) {
      console.error("Failed to start recording", err)
      Alert.alert("Error", "Failed to start recording. Please check microphone permissions.")
    }
  }

  const stopRecording = async () => {
    console.log("Stopping recording..")
    setIsRecording(false)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }

    if (!recording) return

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })
      const uri = recording.getURI()
      console.log("Recording stopped and stored at", uri)
      setAudioUri(uri)
      setRecording(null)
    } catch (error) {
      console.error("Error stopping recording:", error)
    }
  }

  // Send voice message (updated with student context)
  const sendVoiceMessage = async () => {
    if (!audioUri || !sessionId) {
      console.error("Missing required data:", { audioUri: !!audioUri, sessionId })
      return
    }

    addMessage({
      text: `🎵 Voice message (${formatTime(recordingTime)})`,
      sender: "user",
      type: "voice",
    })

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("session_id", sessionId)
      formData.append("language", currentLanguage)
      formData.append("audio", {
        uri: audioUri,
        type: "audio/m4a",
        name: `voice_${Date.now()}.m4a`,
      })
      
      // Add student context to audio request
      const studentContext = prepareStudentContext()
      if (studentContext) {
        console.log("Adding student context to voice request:", studentContext)
        formData.append("student_context", JSON.stringify(studentContext))
      }

      const response = await fetch(`${API_URL}/process-audio`, {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Success response:", data)

      // Show transcription if available
      if (data.transcription) {
        addMessage({
          text: `I heard: "${data.transcription}"`,
          sender: "system",
          isTranscription: true,
        })
      }

      addMessage({
        text: data.response || "Voice message processed!",
        sender: "ai",
        canSpeak: true,
        audio: data.audio,
      })
    } catch (error) {
      console.error("Voice message error:", error)
      addMessage({
        text: `Sorry, I couldn't process your voice message. ${error.message}`,
        sender: "ai",
      })
    } finally {
      setIsLoading(false)
      setAudioUri(null)
      setRecordingTime(0)
    }
  }

  // Handle image selection
  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0])
        setImagePreview(result.assets[0].uri)
        setShowImageModal(true)
      }
    } catch (error) {
      console.error("Error selecting image:", error)
      Alert.alert("Error", "Failed to select image. Please try again.")
    }
  }

  // Handle camera capture
  const handleCameraCapture = (imageUri) => {
    setSelectedImage({ uri: imageUri })
    setImagePreview(imageUri)
    setShowCamera(false)
    setShowImageModal(true)
  }

  // Send image with text (updated with student context)
  const sendImage = async (command = "solve it") => {
    if (!selectedImage || !sessionId) return

    setShowImageModal(false)
    
    // Set the command as message and send with image
    setNewMessage(command)
    
    addMessage({
      text: `📸 Image uploaded: "${command}"`,
      sender: "user",
      imageUrl: imagePreview,
    })

    setIsLoading(true)

    try {
      // Prepare student context
      const studentContext = prepareStudentContext()
      
      
      const formData = new FormData()
      formData.append("session_id", sessionId)
      formData.append("query", command)
      formData.append("language", currentLanguage)
      formData.append("image", {
        uri: selectedImage.uri,
        type: "image/jpeg",
        name: `image_${Date.now()}.jpg`,
      })
      
      // Add student context if available
      if (studentContext) {
        formData.append("student_context", JSON.stringify(studentContext))
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Processing failed: HTTP ${response.status}`)
      }

      const data = await response.json()
      
      addMessage({
        text: data.reply || "I've analyzed your image!",
        sender: "ai",
        canSpeak: true,
        audio: data.audio,
      })
    } catch (error) {
      console.error("Image processing error:", error)
      addMessage({
        text: `❌ Image Analysis Failed\n\nSorry, I couldn't process your image. Error: ${error.message}`,
        sender: "ai",
      })
    } finally {
      setIsLoading(false)
      setSelectedImage(null)
      setImagePreview(null)
      setNewMessage("")
    }
  }

  // Clear image selection
  const clearImageSelection = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setShowImageModal(false)
  }

  // Clear chat (updated for new backend)
  const clearChat = async () => {
    if (!sessionId) return

    try {
      await fetch(`${API_URL}/clear-session/${sessionId}`, {
        method: "DELETE",
      })

      setMessages([])
      setSessionId(null)
      setStudentInfo(null)
      hasInitialized.current = false
      isCreatingSession.current = false

      setTimeout(() => {
        hasInitialized.current = true
        isCreatingSession.current = true
        createSession()
      }, 500)
    } catch (error) {
      console.error("Clear chat error:", error)
      setError("Failed to clear chat. Please try again.")
    }
  }

  // Play response audio
  const playResponseAudio = async (text, audioBase64) => {
    if (isPlayingAudio && !isAudioPaused) return

    setIsPlayingAudio(true)
    setIsAudioPaused(false)
    
    try {
      // If audio data is provided, play it
      if (audioBase64 && Platform.OS !== 'web') {
        const { sound } = await Audio.Sound.createAsync({
          uri: `data:audio/mp3;base64,${audioBase64}`
        })
        
        await sound.playAsync()
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlayingAudio(false)
            setIsAudioPaused(false)
            sound.unloadAsync()
          }
        })
      } else {
        // Fall back to text-to-speech
        const cleanText = text
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/[📝🧮✅🎵⚠]/gu, "")
          
        await Speech.speak(cleanText, {
          language: currentLanguage,
          pitch: 1.0,
          rate: 0.9,
          onDone: () => {
            setIsPlayingAudio(false)
            setIsAudioPaused(false)
          },
          onStopped: () => {
            setIsPlayingAudio(false)
            setIsAudioPaused(false)
          },
          onError: () => {
            setIsPlayingAudio(false)
            setIsAudioPaused(false)
          },
        })
      }
    } catch (error) {
      console.error("TTS error:", error)
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    }
  }

  const pauseResponseAudio = async () => {
    try {
      await Speech.pause()
      setIsAudioPaused(true)
    } catch (e) {
      console.warn('Pause not supported on this platform')
    }
  }

  const resumeResponseAudio = async () => {
    try {
      await Speech.resume()
      setIsAudioPaused(false)
    } catch (e) {
      console.warn('Resume not supported on this platform')
    }
  }

  const stopResponseAudio = async () => {
    try {
      await Speech.stop()
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    } catch (e) {
      setIsPlayingAudio(false)
      setIsAudioPaused(false)
    }
  }

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4caf50"
      case "disconnected":
        return "#f44336"
      case "checking":
        return "#ff9800"
      default:
        return "#9e9e9e"
    }
  }

  // Toggle chat
  const toggleChat = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  // Minimize/maximize chat
  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const maximizeChat = () => {
    setIsMinimized(false)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  // Format message text for React Native
  const formatMessageText = (text) => {
    if (typeof text !== "string") return text

    // Split by bold markers and format
    const parts = text.split(/(\*\*.*?\*\*)/g)

    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={styles.boldText}>
                {part.slice(2, -2)}
              </Text>
            )
          }
          return <Text key={index}>{part}</Text>
        })}
      </Text>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            {
              bottom: Platform.OS === "ios" ? insets.bottom + 80 : 80,
              right: 20,
            },
          ]}
          onPress={toggleChat}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={connectionStatus === "connected" ? ["#3B82F6", "#8B5CF6"] : ["#f44336", "#d32f2f"]}
            style={styles.floatingButtonGradient}
          >
            <Ionicons name="chatbubble" size={24} color="#ffffff" />
            <View style={[styles.connectionIndicator, { backgroundColor: getConnectionStatusColor() }]} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal
        isVisible={isOpen}
        style={styles.modal}
        backdropOpacity={0.3}
        onBackdropPress={closeChat}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
      >
        <View
          style={[
            styles.chatContainer,
            {
              height: isMinimized ? 60 : height * 0.75,
              marginBottom: Platform.OS === "ios" ? insets.bottom : 0,
            },
          ]}
        >
          {/* Chat Header */}
          <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.chatHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.chatTitle}>
                  {/* {studentInfo?.student_class || "Class"} Math Assistant */}{`Class ${className} `}Math Assistant
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
                  <Text style={styles.chatStatus}>
                    {connectionStatus === "connected" && `${languages.find((l) => l.code === currentLanguage)?.name}`}
                    {connectionStatus === "checking" && "Connecting..."}
                    {connectionStatus === "disconnected" && "Disconnected"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              {/* Language Selector */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={connectionStatus !== "connected"}
              >
                <Ionicons name="language" size={20} color="#ffffff" />
              </TouchableOpacity>

              {/* Clear Chat */}
              {/* <TouchableOpacity
                style={styles.headerButton}
                onPress={clearChat}
                disabled={connectionStatus !== "connected" || !sessionId}
              >
                <Ionicons name="trash" size={18} color="#ffffff" />
              </TouchableOpacity> */}

              {/* Close */}
              <TouchableOpacity style={styles.headerButton} onPress={closeChat}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Language Dropdown */}
          {showLanguageDropdown && connectionStatus === "connected" && (
            <View style={styles.languageDropdown}>
              <ScrollView style={styles.languageList}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.languageItem, currentLanguage === lang.code && styles.selectedLanguage]}
                    onPress={() => {
                      setCurrentLanguage(lang.code)
                      setShowLanguageDropdown(false)
                    }}
                  >
                    <Text style={styles.languageText}>
                      {lang.flag} {lang.name} {currentLanguage === lang.code && "✓"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color="#d8000c" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons name="close" size={16} color="#d8000c" />
              </TouchableOpacity>
            </View>
          )}

          {/* Chat Content */}
          {!isMinimized && (
            <View style={styles.chatContent}>
              {/* Messages Area */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer, 
                      message.sender === "user" ? styles.userMessage : 
                      message.sender === "system" ? styles.systemMessage : 
                      styles.aiMessage
                    ]}
                  >
                    {/* Image preview if available */}
                    {message.imageUrl && (
                      <TouchableOpacity onPress={() => setPreviewImageUri(message.imageUrl)}>
                        <Image source={{ uri: message.imageUrl }} style={styles.messageImage} resizeMode="cover" />
                      </TouchableOpacity>
                    )}

                    <View
                      style={[
                        styles.messageBubble, 
                        message.sender === "user" ? styles.userBubble : 
                        message.sender === "system" ? styles.systemBubble :
                        styles.aiBubble
                      ]}
                    >
                      {formatMessageText(message.text)}
                    </View>

                    {/* Message actions */}
                    <View style={styles.messageActions}>
                      {message.sender === "ai" && message.canSpeak && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {/* Play/Pause/Resume Button */}
                          {!isPlayingAudio && (
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={() => playResponseAudio(message.text, message.audio)}
                              disabled={connectionStatus !== "connected"}
                            >
                              <Ionicons name="volume-high" size={14} color={"#666"} />
                              <Text style={styles.playButtonText}>Play</Text>
                            </TouchableOpacity>
                          )}
                          {isPlayingAudio && !isAudioPaused && (Platform.OS === 'ios' || Platform.OS === 'web') && (
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={pauseResponseAudio}
                              disabled={connectionStatus !== "connected"}
                            >
                              <Ionicons name="pause" size={14} color={"#666"} />
                              <Text style={styles.playButtonText}>Pause</Text>
                            </TouchableOpacity>
                          )}
                          {isPlayingAudio && isAudioPaused && (Platform.OS === 'ios' || Platform.OS === 'web') && (
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={resumeResponseAudio}
                              disabled={connectionStatus !== "connected"}
                            >
                              <Ionicons name="play" size={14} color={"#666"} />
                              <Text style={styles.playButtonText}>Resume</Text>
                            </TouchableOpacity>
                          )}
                          {isPlayingAudio && (
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={stopResponseAudio}
                              disabled={connectionStatus !== "connected"}
                            >
                              <Ionicons name="stop" size={14} color={"#666"} />
                              <Text style={styles.playButtonText}>Stop</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <Text style={styles.timestamp}>
                        {message.timestamp?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <View style={[styles.messageBubble, styles.aiBubble]}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.loadingText}>AI is thinking...</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Voice Recording Overlay */}
              {isRecording && (
                <View style={styles.recordingOverlay}>
                  <View style={styles.recordingModal}>
                    <Animated.View style={[styles.recordingIcon, { transform: [{ scale: pulseAnim }] }]}>
                      <Ionicons name="mic" size={48} color="#ff4444" />
                    </Animated.View>
                    <Text style={styles.recordingTitle}>
                      Recording in {languages.find((l) => l.code === currentLanguage)?.name}...
                    </Text>
                    <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                    <Text style={styles.recordingHint}>Release to stop recording (max 60 seconds)</Text>
                    <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                      <Ionicons name="stop" size={16} color="#ffffff" />
                      <Text style={styles.stopButtonText}>Stop Recording</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Voice Preview */}
              {audioUri && !isRecording && (
                <View style={styles.voicePreview}>
                  <Text style={styles.voicePreviewText}>🎵 Voice message recorded ({formatTime(recordingTime)})</Text>
                  <View style={styles.voiceActions}>
                    <TouchableOpacity
                      style={styles.sendVoiceButton}
                      onPress={sendVoiceMessage}
                      disabled={!sessionId || connectionStatus !== "connected"}
                    >
                      <Ionicons name="send" size={14} color="#ffffff" />
                      <Text style={styles.sendVoiceText}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelVoiceButton} onPress={() => setAudioUri(null)}>
                      <Text style={styles.cancelVoiceText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Input Area */}
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: connectionStatus !== "connected" ? "#f5f5f5" : "white" },
                ]}
              >
                {/* Show selected image preview */}
                {imagePreview && (
                  <View style={styles.selectedImagePreview}>
                    <Image source={{ uri: imagePreview }} style={styles.selectedImageThumb} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: connectionStatus !== "connected" ? "#f0f0f0" : "white" },
                    ]}
                    placeholder={
                      connectionStatus === "connected"
                        ? `Ask anything in ${languages.find((l) => l.code === currentLanguage)?.name}...`
                        : "Connecting to AI service..."
                    }
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSubmitEditing={sendTextMessage}
                    editable={!isLoading && connectionStatus === "connected"}
                    multiline
                    maxLength={500}
                  />

                  {/* Camera Capture */}
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={() => setShowCamera(true)}
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    <Ionicons
                      name="camera"
                      size={20}
                      color={isLoading || connectionStatus !== "connected" ? "#ccc" : "#666"}
                    />
                  </TouchableOpacity>

                  {/* Image Upload */}
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={handleImageSelect}
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    <Ionicons
                      name="image"
                      size={20}
                      color={isLoading || connectionStatus !== "connected" ? "#ccc" : "#666"}
                    />
                  </TouchableOpacity>

                  {/* Voice Record */}
                  <TouchableOpacity
                    style={[styles.inputButton, isRecording && styles.recordingButton]}
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    <Ionicons
                      name={isRecording ? "mic-off" : "mic"}
                      size={20}
                      color={isRecording ? "white" : isLoading || connectionStatus !== "connected" ? "#ccc" : "#666"}
                    />
                  </TouchableOpacity>

                  {/* Send Button */}
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendTextMessage}
                    disabled={(!newMessage.trim() && !imagePreview) || isLoading || connectionStatus !== "connected"}
                  >
                    <LinearGradient
                      colors={["#3B82F6", "#8B5CF6"]}
                      style={[
                        styles.sendButtonGradient,
                        ((!newMessage.trim() && !imagePreview) || isLoading || connectionStatus !== "connected") && styles.disabledButton,
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Ionicons name="send" size={18} color="#ffffff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isVisible={!!previewImageUri}
        style={{ margin: 0 }}
        backdropOpacity={1}
        onBackdropPress={() => setPreviewImageUri(null)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
      >
        <BlurView intensity={80} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 30, zIndex: 2 }} onPress={() => setPreviewImageUri(null)}>
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUri }}
            style={{ width: '90%', height: '70%', borderRadius: 20, resizeMode: 'contain', backgroundColor: '#222' }}
          />
        </BlurView>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isVisible={showImageModal}
        style={styles.imageModal}
        backdropOpacity={0.8}
        onBackdropPress={clearImageSelection}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View style={styles.imageModalContent}>
          <Text style={styles.imageModalTitle}>📸 Choose Analysis Type</Text>

          {imagePreview && <Image source={{ uri: imagePreview }} style={styles.imagePreview} resizeMode="contain" />}

          <View style={styles.analysisOptions}>
            <Text style={styles.optionsTitle}>🤖 What should I do with this image?</Text>

            <TouchableOpacity
              style={[styles.analysisOption, styles.solveOption]}
              onPress={() => sendImage("solve it")}
              disabled={connectionStatus !== "connected"}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionEmoji}>🧮</Text>
                <Text style={styles.optionTitle}>Solve It</Text>
              </View>
              <Text style={styles.optionDescription}>I'll analyze and solve the math problems in your image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.analysisOption, styles.correctOption]}
              onPress={() => sendImage("correct it")}
              disabled={connectionStatus !== "connected"}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionEmoji}>✅</Text>
                <Text style={styles.optionTitle}>Correct It</Text>
              </View>
              <Text style={styles.optionDescription}>I'll check and correct the answers shown in your image</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageModalActions}>
            <TouchableOpacity style={styles.cancelImageButton} onPress={clearImageSelection}>
              <Text style={styles.cancelImageText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageTip}>
            <Text style={styles.imageTipText}>
              💡 <Text style={styles.imageTipBold}>Tip:</Text> Choose "Solve It" for questions you need help with, or
              "Correct It" to check existing answers
            </Text>
          </View>
        </View>
      </Modal>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          visible={showCamera}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    width: 56,
    height: 56,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  connectionIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: "white",
  },
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  chatContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  chatTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  chatStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  languageDropdown: {
    backgroundColor: "white",
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  languageList: {
    maxHeight: 200,
  },
  languageItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedLanguage: {
    backgroundColor: "#f0f8ff",
  },
  languageText: {
    fontSize: 14,
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#ffe6e6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ffcccb",
  },
  errorText: {
    color: "#d8000c",
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  chatContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  aiMessage: {
    alignSelf: "flex-start",
  },
  systemMessage: {
    alignSelf: "center",
    maxWidth: "90%",
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#3B82F6",
  },
  aiBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  systemBubble: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
    color: "#2c3e50",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  playButtonText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  recordingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  recordingModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#ff4444",
  },
  recordingIcon: {
    marginBottom: 16,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  recordingTime: {
    fontSize: 24,
    color: "#ff4444",
    fontWeight: "bold",
    marginBottom: 16,
  },
  recordingHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: "#dc3545",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  stopButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  voicePreview: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voicePreviewText: {
    fontSize: 14,
    flex: 1,
  },
  voiceActions: {
    flexDirection: "row",
    gap: 8,
  },
  sendVoiceButton: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sendVoiceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cancelVoiceButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelVoiceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  selectedImagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
  },
  selectedImageThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
  },
  removeImageButton: {
    marginLeft: "auto",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingButton: {
    backgroundColor: "#ff4444",
    borderColor: "#ff4444",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  imageModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    maxWidth: "90%",
    maxHeight: "90%",
    minWidth: 300,
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisOptions: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 12,
  },
  analysisOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  solveOption: {
    borderColor: "#2196F3",
    backgroundColor: "#f0f8ff",
  },
  correctOption: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff0",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginLeft: 32,
  },
  imageModalActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  cancelImageButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  cancelImageText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  imageTip: {
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc02",
  },
  imageTipText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 16,
  },
  imageTipBold: {
    fontWeight: "bold",
  },
})

export default ChatBox