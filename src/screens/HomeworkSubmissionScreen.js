import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CameraCapture from '../components/CameraCapture';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import axiosInstance from '../api/axiosInstance';
import MathRichText from '../components/MathRichText';
import KeyboardAwareScreen from '../components/KeyboardAwareScreen';

const HomeworkSubmissionScreen = () => {
  const [submissionType, setSubmissionType] = useState('image');
  const [imageFiles, setImageFiles] = useState([]);
  const [imageSourceType, setImageSourceType] = useState('upload');
  const [assignment, setAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState(null);

  const route = useRoute();
  const navigation = useNavigation();
  const { username, role } = useContext(AuthContext);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Get homework details from route params (passed from notification)
        const homeworkDetails = route.params?.homeworkDetails;
        console.log("from route.params:", homeworkDetails);
        
        if (homeworkDetails) {
          console.log("Using homework details from navigation params:", homeworkDetails);
          setAssignment(homeworkDetails);
        } else {
          setError("No homework details provided");
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
        setError("Failed to load assignment details");
      }
    };
    
    fetchAssignment();
  }, [route.params]);

  const openCameraCapture = () => {
    setShowCameraCapture(true);
  };

  const handleCapturedImage = (uri) => {
    // Accept both file URIs and data URLs
    const imageName = `homework-response-${Date.now()}.jpg`;
    const newImage = {
      uri,
      type: 'image/jpeg',
      name: imageName,
    };
    setImageFiles(prev => [...prev, newImage]);
    setError(null);
    setShowCameraCapture(false);
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllImages = () => {
    setImageFiles([]);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    if (imageFiles.length === 0) {
      setError('Please upload or capture at least one image');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('homework_code', assignment.homework_code);
      formData.append('student_id', username);
      formData.append('submission_type', 'image');

      // Append each image separately like the web app does
      for (const file of imageFiles) {
        if (Platform.OS === 'web') {
          // Convert data URL or remote URL to Blob/File for web
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const webFile = new File([blob], file.name || `homework-response-${Date.now()}.jpg`, { type: file.type || blob.type || 'image/jpeg' });
          formData.append('image_response', webFile);
        } else {
          formData.append('image_response', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `homework-response-${Date.now()}.jpg`,
          });
        }
      }
      console.log('Submitting homework:', formData);

      // Use upload helper to set proper headers and track progress
      const response = await axiosInstance.uploadFile(
        '/homework-submission/',
        formData,
        (percent) => setUploadProgress(percent)
      );

      setSuccess('Homework submitted successfully!');
      setImageFiles([]);
      setUploadProgress(0);

      // Redirect to appropriate dashboard after submission
      setTimeout(() => {
        if (role === 'teacher') {
          navigation.navigate('TeacherTabs', { screen: 'TeacherDash' });
        } else {
          navigation.navigate('StudentTabs', { screen: 'Dashboard' });
        }

        setTimeout(() => {
          if (Platform.OS === 'web') {
            window.location.reload();
          }
        }, 100);
      }, 2000);
      

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit homework');
      console.error('Error submitting homework:', error);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = assignment?.due_date ? (new Date() > new Date(assignment.due_date)) : false;

  if (!username) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to submit homework</Text>
        </View>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <ActivityIndicator size="large" color="#667eea" />
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentContainerStyle={{ paddingHorizontal: 16 }}>
      <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="document-text" size={32} color="#ffffff" />
          <Text style={styles.headerTitle}>Submit Homework</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Assignment Details */}
        <View style={styles.assignmentCard}>
          <Text style={styles.assignmentTitle}>{assignment.title || 'Untitled Homework'}</Text>
          
          {assignment.questions && assignment.questions.map((question, index) => (
            <View key={index} style={styles.questionContainer}>
              <Text style={styles.questionTitle}>Question {index + 1}</Text>
              {/* <Text style={styles.questionText}>{question.question}</Text> */}
              <MathRichText content={question.question} />
              {question.image && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setZoomImageUri(question.image);
                    setZoomVisible(true);
                  }}
                >
                  <Image source={{ uri: question.image }} style={styles.questionImage} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={styles.assignmentMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text style={styles.metaText}>Student: {username}</Text>
            </View>
          </View>

          {isOverdue && (
            <View style={styles.overdueWarning}>
              <Ionicons name="warning" size={16} color="#ef4444" />
              <Text style={styles.overdueText}>This assignment is overdue</Text>
            </View>
          )}
        </View>

        {/* Error/Success Messages */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* Submission Form */}
        <View style={styles.formCard}>
          {/* Image Response */}
            <View style={styles.imageContainer}>
              {/* Image Source Selection */}
              <View style={styles.sourceSelector}>
                {/* <TouchableOpacity
                  style={[
                    styles.sourceButton,
                    imageSourceType === 'upload' && styles.activeSourceButton
                  ]}
                  onPress={() => setImageSourceType('upload')}
                  disabled={isSubmitting}
                >
                  <Ionicons 
                    name="images" 
                    size={20} 
                    color={imageSourceType === 'upload' ? '#ffffff' : '#667eea'} 
                  />
                  <Text style={[
                    styles.sourceButtonText,
                    imageSourceType === 'upload' && styles.activeSourceButtonText
                  ]}>
                    Upload Images
                  </Text>
                </TouchableOpacity> */}

             
              </View>

              {/* Image Actions */}
              <View style={styles.imageActions}>
                {(
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={openCameraCapture}
                    disabled={isSubmitting}
                  >
                    <Ionicons name={imageSourceType === 'upload' ? "images" : "camera"} size={20} color="#667eea" />
                    <Text style={styles.actionButtonText}>
                      {imageSourceType === 'upload' ? 'Select or Capture' : 'Select or Capture'}
                    </Text>
                  </TouchableOpacity>
                )}

                {imageFiles.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.clearButton]}
                    onPress={handleClearAllImages}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text style={[styles.actionButtonText, styles.clearButtonText]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{uploadProgress}% uploaded</Text>
                </View>
              )}

              {/* Image Previews */}
              {imageFiles.length > 0 && (
                <View style={styles.imagePreviews}>
                  <Text style={styles.previewsTitle}>
                    Selected Images ({imageFiles.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {imageFiles.map((image, index) => (
                      <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => handleRemoveImage(index)}
                          disabled={isSubmitting}
                        >
                          <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || 
                imageFiles.length === 0) && 
                styles.disabledButton
              ]
            }
            onPress={handleSubmit}
            disabled={
              isSubmitting || 
              imageFiles.length === 0
            }
          >
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Homework'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    {/* Camera / Gallery Modal */}
    <CameraCapture 
      visible={showCameraCapture}
      onCapture={handleCapturedImage}
      onClose={() => setShowCameraCapture(false)}
    />
    {/* Image Zoom Modal */}
    <Modal
      visible={zoomVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setZoomVisible(false)}
    >
      <View style={styles.zoomBackdrop}>
        <TouchableOpacity style={styles.zoomCloseArea} activeOpacity={1} onPress={() => setZoomVisible(false)} />
        <View style={styles.zoomContainer}>
          <ScrollView
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
            centerContent
          >
            {zoomImageUri && (
              <Image
                source={{ uri: zoomImageUri }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
          <TouchableOpacity style={styles.zoomCloseButton} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.zoomCloseArea} activeOpacity={1} onPress={() => setZoomVisible(false)} />
      </View>
    </Modal>
    </KeyboardAwareScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7E20E3',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  questionImage: {
    width: '100%',
    height:'300',
    objectFit: 'contain',
    borderRadius: 8,
    marginTop: 8,
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  zoomContainer: {
    width: '100%',
    height: '80%',
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 16,
  },
  assignmentMeta: {
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  overdueText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  activeTypeButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  textInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  imageContainer: {
    marginBottom: 20,
  },
  sourceSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  sourceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  activeSourceButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  activeSourceButtonText: {
    color: '#ffffff',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  clearButton: {
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#ef4444',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  imagePreviews: {
    marginTop: 16,
  },
  previewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default HomeworkSubmissionScreen;
