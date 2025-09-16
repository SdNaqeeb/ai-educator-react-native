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
import { AuthContext } from "../contexts/AuthContext"
import CameraCapture from "../components/CameraCapture"
import { BlurView } from 'expo-blur'
import { Audio } from 'expo-av'
import axios from "axios"
import axiosInstance from "../api/axiosInstance"


const { width, height } = Dimensions.get("window")

// API configuration
const API_URL = "https://chatbot.smartlearners.ai"
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

const TableComponent = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Calculate max height based on number of rows (limit to 5 visible rows)
  const maxVisibleRows = 5;
  const rowHeight = 45; // Approximate height per row
  const headerHeight = 45;
  const maxHeight = Math.min(data.length * rowHeight, maxVisibleRows * rowHeight) + headerHeight;

  return (
    <View style={[tableStyles.wrapper, { maxHeight }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={tableStyles.scrollView}
        nestedScrollEnabled={true}
      >
        <View style={tableStyles.container}>
          {/* Header Row */}
          <View style={tableStyles.headerRow}>
            {data[0].map((header, index) => (
              <View key={index} style={[tableStyles.cell, tableStyles.headerCell]}>
                <Text style={tableStyles.headerText}>{header}</Text>
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          <ScrollView 
            style={{ maxHeight: maxVisibleRows * rowHeight }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            {data.slice(1).map((row, rowIndex) => (
              <View key={rowIndex} style={tableStyles.row}>
                {row.map((cell, cellIndex) => (
                  <View key={cellIndex} style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const tableStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f6fa',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  headerCell: {
    backgroundColor: '#3B82F6',
  },
  headerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
});

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
  const [connectionStatus, setConnectionStatus] = useState("checking")

  // Image States
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [previewImageUri, setPreviewImageUri] = useState(null)

  // UI States
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  // Audio States
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState(null)
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null)
  const [playingMessageId, setPlayingMessageId] = useState(null) // Added new state

  // Refs
  const messagesEndRef = useRef(null)
  const messageCounter = useRef(0)
  const hasInitialized = useRef(false)
  const scrollViewRef = useRef(null)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Languages
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "te", name: "Telugu", flag: "🇮🇳" },
  ]

  // ====== Fetch Student Data Function ======
  const fetchStudentData = async () => {
    try {
      console.log("Fetching student data for:", username)
      const response = await axiosInstance.post("dummy/", {
        homework: "true",
        agentic_data: "true",
      })
      
      console.log("✅ Student Data Response:", response.data)
      
      if (response.data && response.data[username]) {
        console.log("📦 Student data found for", username)
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

  // Fetch student data and create session
  const fetchStudentDataAndCreateSession = async () => {
    setConnectionStatus("checking")
    console.log("Fetching student data and creating session for:", username)
    
    try {
      // First, fetch the student data
      const data = await fetchStudentData()
      
      let filteredData = null
      if (data) {
        filteredData = data
        setStudentInfo(filteredData)
        console.log("✅ Student data fetched:", filteredData)
      } else {
        console.warn("⚠️ No student data found for", username)
      }
      
      // Now create session with the fetched data
      await createSessionWithData(filteredData)
      
    } catch (err) {
      console.error("❌ Failed to fetch student data or create session:", err)
      setConnectionStatus("disconnected")
      setMessages([{
        id: "conn_fail",
        text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
        sender: "ai",
        timestamp: new Date(),
      }])
    }
  }

  const createSessionWithData = async (studentData) => {
    try {
      // Use the passed studentData directly, not the state
      const filteredStudentInfo = {
        data: studentData || {},
      }

      console.log("Creating session with student info:", filteredStudentInfo)
      
      const payload = {
        student_id: username,
        json_data: filteredStudentInfo,
      }
      
      const res = await api.post("/create_session", payload)
      console.log("create_session response:", res.data)
      
      if (!res.data?.session_id) throw new Error("No session_id")
      
      setSessionId(res.data.session_id)
      setConnectionStatus("connected")
      console.log("Session created successfully:", res.data.session_id)
      
    } catch (e) {
      console.error("create_session error:", e)
      setConnectionStatus("disconnected")
      setMessages((prev) => [
        ...prev,
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }
  }

  // Initial session creation - wait for username
  useEffect(() => {
    if (hasInitialized.current) return
    if (!username) return // Wait for username to be available
    
    hasInitialized.current = true
    fetchStudentDataAndCreateSession()
  }, [username])

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0 && connectionStatus === "connected") {
      addMessage({
        text: "👋 Hi! I'm your Math Assistant. Ask a doubt or upload a problem image.",
        sender: "ai",
      })
    }
  }, [connectionStatus])

  // Cleanup audio on unmount - Updated
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('Cleaning up audio on unmount')
        sound.stopAsync().then(() => sound.unloadAsync())
      }
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [])

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

  // Send message base function
  const sendMessageBase = async (text, imageFile) => {
    if (!sessionId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Connecting… please try again in a moment.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
      return
    }

    const id = Date.now()
    setMessages((prev) => [
      ...prev,
      {
        id,
        text,
        sender: "user",
        timestamp: new Date(),
        imageUrl: imageFile ? imagePreview : null,
      },
    ])
    setNewMessage("")
    setIsLoading(true)

    try {
      const combinedQuery = `${text || ""} `
      
      if (imageFile) {
        // Image upload with message
        const formData = new FormData()
        formData.append("session_id", sessionId)
        formData.append("query", combinedQuery || "")
        formData.append("language", currentLanguage)
        
        // For React Native, we need to format the image differently
        formData.append("image", {
          uri: imageFile.uri || imageFile,
          type: "image/jpeg",
          name: `image_${Date.now()}.jpg`,
        })
        
        // Add student context if available
        if (studentInfo) {
          formData.append("student_context", JSON.stringify(studentInfo))
        }

        const res = await api.post("/chat", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        
        const audioBase64 = res?.data?.audio
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null
        
        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.reply || "I've analyzed your image!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ])
      } else {
        // Text-only message
        const requestBody = {
          session_id: sessionId,
          query: text || "",
          language: currentLanguage,
        }
        
        // Add student context if available
        if (studentInfo) {
          requestBody.student_context = studentInfo
        }

        const res = await api.post("/chat-simple", requestBody, {
          headers: { 
            "Content-Type": "application/json",
            session_token: sessionId 
          },
        })

        const audioBase64 = res?.data?.audio
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.reply || "I received your message!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ])
      }
    } catch (e) {
      console.error("sendMessage error:", e)
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: "❌ Sorry, I couldn't process that right now. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      clearSelectedFile()
    }
  }

  // Send text message
  const sendTextMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return
    await sendMessageBase(newMessage.trim(), selectedImage)
  }

  // Send image with command
  const sendImageWithCommand = async (command) => {
    setShowImageModal(false)
    await sendMessageBase(command, selectedImage)
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

  // Clear image selection
  const clearSelectedFile = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setShowImageModal(false)
  }

  // ====== API Test Function ======
  const testAPIConnection = async () => {
    try {
      console.log("Testing API connection...")
      const response = await api.get("/")
      console.log("API connection test successful:", response.status)
      return true
    } catch (error) {
      console.error("API connection test failed:", error.message)
      return false
    }
  }

  // ====== Audio Recording Functions ======
  const startRecording = async () => {
    if (isRecording || connectionStatus !== "connected" || !sessionId) return
    
    try {
      console.log('Requesting permissions..')
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to record audio.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      console.log('Starting recording..')
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      setIsRecording(true)
      console.log('Recording started')
    } catch (err) {
      console.error('Failed to start recording', err)
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.')
    }
  }

  const stopRecording = async () => {
    if (!isRecording || !recording) return
    
    try {
      console.log('Stopping recording..')
      setIsRecording(false)
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })
      
      const uri = recording.getURI()
      console.log('Recording stopped and stored at', uri)
      
      if (uri) {
        await processAudioFile(uri)
      }
      
      setRecording(null)
    } catch (err) {
      console.error('Failed to stop recording', err)
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.')
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  const processAudioFile = async (audioUri) => {
    if (!sessionId) return
    
    const id = Date.now()
    setIsLoading(true)
    
    // Show processing placeholder
    addMessage({
      text: "🎙️ Processing audio...",
      sender: "user",
    })

    try {
      console.log("Processing audio file:", audioUri)
      console.log("Session ID:", sessionId)
      console.log("Language:", currentLanguage)
      
      // Test API connection first
      const isAPIConnected = await testAPIConnection()
      if (!isAPIConnected) {
        throw new Error("API connection failed")
      }
      
      // Create FormData with proper file format for React Native
      const formData = new FormData()
      formData.append("session_id", sessionId)
      formData.append("language", currentLanguage)
      
      // Add student context if available
      if (studentInfo) {
        formData.append("student_context", JSON.stringify(studentInfo))
      }
      
      // For React Native, we need to append the file object with proper structure
      // The key difference is using the correct MIME type and filename
      formData.append("audio", {
        uri: audioUri,
        type: "audio/x-m4a", // Changed from audio/m4a to audio/x-m4a to match API
        name: `recording_${id}.m4a`,
      })

      console.log("Sending request to /process-audio")
      console.log("Full URL:", `${API_URL}/process-audio`)
      
      const res = await api.post("/process-audio", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Accept": "application/json"
        },
      })
      
      console.log("Audio processing response:", res.data)

      const transcription = res?.data?.transcription || "(no transcription)"
      const aiText = res?.data?.response || res?.data?.content || ""
      const audioBase64 = res?.data?.audio || res?.data?.audio_bytes
      const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null

      // Remove processing placeholder and add actual messages
      setMessages((prev) => {
        const withoutPlaceholder = prev.filter((m) => m.text !== "🎙️ Processing audio...")
        return [
          ...withoutPlaceholder,
          {
            id: `user_${id}`,
            text: transcription,
            sender: "user",
            timestamp: new Date(),
          },
          {
            id: `ai_${id + 1}`,
            text: aiText,
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]
      })
    } catch (e) {
      console.error("processAudio error:", e)
      console.error("Error details:", {
        message: e.message,
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        url: e.config?.url,
        baseURL: e.config?.baseURL
      })
      
      let errorMessage = "❌ Sorry, I couldn't process the audio. Please try again."
      if (e.response?.status === 404) {
        errorMessage = "❌ Audio processing endpoint not found. Please check your connection."
      } else if (e.response?.status === 422) {
        errorMessage = "❌ Invalid audio format. Please try recording again."
      } else if (e.response?.status === 400) {
        errorMessage = "❌ Audio too short or invalid. Please try recording again."
      }
      
      addMessage({
        text: errorMessage,
        sender: "ai",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Updated playAudio function with proper play/pause functionality
  const playAudio = async (audioUrl, messageId) => {
    try {
      console.log('playAudio called with:', { audioUrl, messageId, currentMessageId: playingMessageId })
      
      // If the same audio is playing, stop it
      if (playingMessageId === messageId && isPlaying && sound) {
        console.log('Stopping current audio')
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
        setIsPlaying(false)
        setCurrentAudioUrl(null)
        setPlayingMessageId(null)
        return
      }
      
      // If different audio is playing, stop it first
      if (sound && playingMessageId !== messageId) {
        console.log('Stopping different audio')
        try {
          await sound.stopAsync()
          await sound.unloadAsync()
        } catch (error) {
          console.error('Error stopping previous audio:', error)
        }
        setSound(null)
        setIsPlaying(false)
        setCurrentAudioUrl(null)
        setPlayingMessageId(null)
      }
      
      // Create and play new sound
      console.log('Creating new sound')
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true,
          rate: 1.25,
          shouldCorrectPitch: true
        }
      )
      
      setSound(newSound)
      setCurrentAudioUrl(audioUrl)
      setPlayingMessageId(messageId)
      setIsPlaying(true)
      
      // Set up playback status update
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('Audio finished playing')
          newSound.unloadAsync()
          setSound(null)
          setIsPlaying(false)
          setCurrentAudioUrl(null)
          setPlayingMessageId(null)
        }
      })
      
    } catch (error) {
      console.error('Error in playAudio:', error)
      setIsPlaying(false)
      setCurrentAudioUrl(null)
      setPlayingMessageId(null)
      setSound(null)
    }
  }

  // Optional: Separate stop function
  const stopAudio = async () => {
    if (sound) {
      try {
        console.log('Stopping audio')
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
        setIsPlaying(false)
        setCurrentAudioUrl(null)
        setPlayingMessageId(null)
      } catch (error) {
        console.error('Error stopping audio:', error)
      }
    }
  }

  // Clear chat
  const clearChat = async () => {
    if (!sessionId) return
    
    try {
      await api.delete(`/clear-session/${sessionId}`)
    } catch (e) {
      console.error("Failed to clear session:", e)
    } finally {
      setMessages([
        {
          id: "cleared",
          text: "🧹 Chat cleared. Starting a fresh session… Ask your next question!",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
      setSessionId(null)
      setConnectionStatus("checking")
      // Re-fetch data and create new session
      await fetchStudentDataAndCreateSession()
    }
  }

  // Parse table from markdown
  const parseMarkdownTable = (text) => {
    const lines = text.trim().split('\n');
    const table = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip separator lines (e.g., |---|---|---|)
      if (line.match(/^\|[\s-:|]+\|$/)) continue;
      
      // Parse table rows
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .split('|')
          .slice(1, -1) // Remove first and last empty elements
          .map(cell => cell.trim());
        
        if (cells.length > 0) {
          table.push(cells);
        }
      }
    }
    
    return table;
  };

  // Format message text for React Native with table support
  const formatMessageText = (text) => {
    if (typeof text !== "string") return text;

    // Check if the text contains a markdown table
    const hasTable = text.includes('|') && text.includes('\n') && 
                    (text.includes('---|') || text.includes('---'));

    if (hasTable) {
      // Split text into parts (before table, table, after table)
      const parts = [];
      const lines = text.split('\n');
      let currentPart = [];
      let inTable = false;
      let tableData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('|') && line.endsWith('|')) {
          if (!inTable && currentPart.length > 0) {
            // Save text before table
            parts.push({
              type: 'text',
              content: currentPart.join('\n')
            });
            currentPart = [];
          }
          inTable = true;
          
          // Skip separator lines
          if (!line.match(/^\|[\s-:|]+\|$/)) {
            const cells = line
              .split('|')
              .slice(1, -1)
              .map(cell => cell.trim());
            
            if (cells.length > 0) {
              tableData.push(cells);
            }
          }
        } else {
          if (inTable && tableData.length > 0) {
            // Save table
            parts.push({
              type: 'table',
              content: tableData
            });
            tableData = [];
            inTable = false;
          }
          
          if (line) {
            currentPart.push(line);
          }
        }
      }

      // Handle remaining content
      if (tableData.length > 0) {
        parts.push({
          type: 'table',
          content: tableData
        });
      } else if (currentPart.length > 0) {
        parts.push({
          type: 'text',
          content: currentPart.join('\n')
        });
      }

      // Render mixed content
      return (
        <View >
          {parts.map((part, index) => {
            if (part.type === 'table') {
              return <TableComponent key={index} data={part.content} />;
            } else {
              // Apply bold formatting to text parts
              const textParts = part.content.split(/(\*\*.*?\*\*)/g);
              return (
                <Text key={index} style={styles.messageText}>
                  {textParts.map((textPart, textIndex) => {
                    if (textPart.startsWith("**") && textPart.endsWith("**")) {
                      return (
                        <Text key={textIndex} style={styles.boldText}>
                          {textPart.slice(2, -2)}
                        </Text>
                      );
                    }
                    return <Text key={textIndex}>{textPart}</Text>;
                  })}
                </Text>
              );
            }
          })}
        </View>
      );
    }

    // If no table, handle bold formatting as before
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={styles.boldText}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

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

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
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
                  🤖 {`${className}`} Math Assistant
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
              <TouchableOpacity
                style={styles.headerButton}
                onPress={clearChat}
                disabled={connectionStatus !== "connected" || !sessionId}
              >
                <Ionicons name="trash" size={18} color="#ffffff" />
              </TouchableOpacity>

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
                      
                      {/* Updated Audio playback for AI messages */}
                      {message.audioUrl && message.sender === "ai" && (
                        <TouchableOpacity
                          style={[
                            styles.audioButton,
                            playingMessageId === message.id && isPlaying && styles.audioButtonPlaying
                          ]}
                          onPress={() => playAudio(message.audioUrl, message.id)}
                        >
                          <Ionicons 
                            name={playingMessageId === message.id && isPlaying ? "pause-circle" : "play-circle"} 
                            size={24} 
                            color={playingMessageId === message.id && isPlaying ? "#f44336" : "#3B82F6"} 
                          />
                          <Text style={[
                            styles.audioButtonText,
                            playingMessageId === message.id && isPlaying && styles.audioButtonTextPlaying
                          ]}>
                            {playingMessageId === message.id && isPlaying ? "Pause Audio" : "Play Audio"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Message timestamp */}
                    <Text style={[
                      styles.timestamp,
                      message.sender === "user" && styles.userTimestamp
                    ]}>
                      {message.timestamp?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.loadingText}>AI is thinking...</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

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
                        ? `Type your question...`
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

                  {/* Audio Recording */}
                  <TouchableOpacity
                    style={[
                      styles.inputButton,
                      isRecording && styles.recordingButton
                    ]}
                    onPress={toggleRecording}
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    <Ionicons
                      name={isRecording ? "stop" : "mic"}
                      size={20}
                      color={
                        isRecording 
                          ? "#fff" 
                          : isLoading || connectionStatus !== "connected" 
                            ? "#ccc" 
                            : "#666"
                      }
                    />
                  </TouchableOpacity>

                  {/* Image Upload */}
                  {/* <TouchableOpacity
                    style={styles.inputButton}
                    onPress={handleImageSelect}
                    disabled={isLoading || connectionStatus !== "connected"}
                  >
                    <Ionicons
                      name="image"
                      size={20}
                      color={isLoading || connectionStatus !== "connected" ? "#ccc" : "#666"}
                    />
                  </TouchableOpacity> */}

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

      {/* Image Action Modal */}
      <Modal
        isVisible={showImageModal}
        style={styles.imageModal}
        backdropOpacity={0.8}
        onBackdropPress={clearSelectedFile}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View style={styles.imageModalContent}>
          <Text style={styles.imageModalTitle}>📸 Choose Analysis Type</Text>

          {imagePreview && <Image source={{ uri: imagePreview }} style={styles.imagePreview} resizeMode="contain" />}

          <View style={styles.analysisOptions}>
            <TouchableOpacity
              style={[styles.analysisOption, styles.solveOption]}
              onPress={() => sendImageWithCommand("solve it")}
              disabled={connectionStatus !== "connected"}
            >
              <Text style={styles.optionEmoji}>🧮</Text>
              <Text style={styles.optionTitle}>Solve It</Text>
              <Text style={styles.optionDescription}>I'll analyze and solve the problems</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.analysisOption, styles.correctOption]}
              onPress={() => sendImageWithCommand("correct it")}
              disabled={connectionStatus !== "connected"}
            >
              <Text style={styles.optionEmoji}>✅</Text>
              <Text style={styles.optionTitle}>Correct It</Text>
              <Text style={styles.optionDescription}>I'll check your answers</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelImageButton} onPress={clearSelectedFile}>
            <Text style={styles.cancelImageText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.imageTip}>
            <Text style={styles.imageTipText}>
              💡 Tip: Use "Solve It" for new questions, "Correct It" to check your answers.
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
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
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
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
  },
  userTimestamp: {
    alignSelf: "flex-end",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
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
    gap: 12,
    marginBottom: 20,
  },
  analysisOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  solveOption: {
    borderColor: "#2196F3",
    backgroundColor: "#f0f8ff",
  },
  correctOption: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0fff0",
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  cancelImageButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: "center",
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
    marginTop: 16,
  },
  imageTipText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 16,
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0f8ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  audioButtonPlaying: {
    backgroundColor: "#ffe6e6",
    borderColor: "#f44336",
  },
  audioButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  audioButtonTextPlaying: {
    color: "#f44336",
  },
  recordingButton: {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  stopButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  stopButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
})

export default ChatBox