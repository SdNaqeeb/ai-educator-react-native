import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform,
  Image 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';

const CameraCapture = ({ visible, onCapture, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Check if running on web
  const isWeb = Platform.OS === 'web';

  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!visible && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setShowWebCamera(false);
    }
  }, [visible]);

  const requestPermissions = async () => {
    if (isWeb) {
      // On web, we'll check for camera permissions when needed
      return true;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera permissions to capture images.",
        [{ text: "OK" }],
      );
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    if (isWeb) {
      // For web, show camera stream
      startWebCamera();
    } else {
      // For mobile, use expo-image-picker
      takePictureMobile();
    }
  };

  const takePictureMobile = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
    
        quality: 1, // get the best quality from camera
      });

      if (!result.canceled && result.assets[0]) {
        // Resize and compress before sending
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }], // 1200px width for good quality
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        onCapture(manipResult.uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startWebCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setShowWebCamera(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      
      // Fallback to file input with camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onCapture(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
      setIsLoading(false);
    }
  };

  const captureWebPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setShowWebCamera(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startWebCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const pickFromGallery = async () => {
    if (isWeb) {
      pickFromGalleryWeb();
    } else {
      pickFromGalleryMobile();
    }
  };

  const pickFromGalleryMobile = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
     
        quality: 1, // get the best quality from gallery
      });

      if (!result.canceled && result.assets[0]) {
        // Resize and compress before sending
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1200 } }], // 1200px width for good quality
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        onCapture(manipResult.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGalleryWeb = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        onCapture(e.target.result);
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        Alert.alert("Error", "Failed to read image file.");
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    // Clean up camera stream before closing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowWebCamera(false);
    setCapturedImage(null);
    onClose();
  };

  return (
    <>
      <Modal
        isVisible={visible}
        style={styles.modal}
        backdropOpacity={0.7}
        onBackdropPress={handleClose}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {showWebCamera ? "Take Photo" : capturedImage ? "Review Photo" : "Capture Answer"}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {!showWebCamera && !capturedImage && (
            <>
              <Text style={styles.description}>
                Take a photo of your handwritten answer or select from gallery
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cameraButton]}
                  onPress={takePicture}
                  disabled={isLoading}
                >
                  <Ionicons name="camera" size={32} color="#ffffff" />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.galleryButton]}
                  onPress={pickFromGallery}
                  disabled={isLoading}
                >
                  <Ionicons name="images" size={32} color="#ffffff" />
                  <Text style={styles.buttonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Web Camera View */}
          {isWeb && showWebCamera && (
            <View style={styles.cameraContainer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={styles.videoElement}
              />
              <TouchableOpacity
                style={styles.captureButton}
                onPress={captureWebPhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <View style={styles.previewContainer}>
              <Image 
                source={{ uri: capturedImage }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewButtons}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.retakeButton]}
                  onPress={retakePhoto}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.previewButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, styles.confirmButton]}
                  onPress={confirmPhoto}
                >
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.previewButtonText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isLoading && <Text style={styles.loadingText}>Processing...</Text>}
        </View>
      </Modal>

      {/* Hidden inputs for web */}
      {isWeb && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a202c",
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: "#667eea",
  },
  galleryButton: {
  
    justifyContent: "center", 
    backgroundColor: "#10b981",
   

  },
  buttonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#667eea",
    marginTop: 16,
    fontWeight: "500",
  },
  cameraContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoElement: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraCapture;