import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Video from 'react-native-video';
// Removed: import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import env from './env';
import apiClient from './api';

// --- EMOJI MAPPING ---
const EMOJI_MAP = {
  FlashOn: '💡', // Flashlight/Light Bulb for 'flash'
  FlashOff: '📴', // Generic symbol for 'off' or 'no flash'
  Close: '✖️', // Close/Cross mark
  CameraFlip: '🔄', // Rotate/Flip symbol
  Stop: '🛑', // Stop sign
  Record: '🔴', // Red circle for record
  PlayBox: '▶️', // Play button
  Trash: '🗑️', // Trash can/Redo
  Upload: '☁️', // Cloud for upload
  Lock: '🔒', // Lock for permissions
  Grant: '🔓', // Unlock for permissions button
};

const CIRCLE_DIAMETER = 100;
const BORDER_WIDTH = 8;
const INNER_CIRCLE_DIAMETER = CIRCLE_DIAMETER - BORDER_WIDTH * 2;

const UploadProgressCircle = ({ progress = 0 }) => {
  // The logic for the progress circle remains the same
  const clampedProgress = Math.round(Math.max(0, Math.min(100, progress)));
  const progressDegrees = (clampedProgress / 100) * 360;

  const ProgressLayer = ({ degrees }) => (
    <View style={[styles.progressLayer, { transform: [{ rotate: `${degrees}deg` }] }]}>
      <View style={styles.progressSpinner} />
    </View>
  );

  return (
    <View style={styles.container1}>
      <View style={styles.backgroundTrack} />

      <ProgressLayer degrees={progressDegrees <= 180 ? progressDegrees : 180} />

      {clampedProgress > 50 && (
        <ProgressLayer degrees={progressDegrees} />
      )}
      
      <View style={styles.innerCircle}>
        <Text style={styles.progressText}>{`${clampedProgress}%`}</Text>
      </View>
    </View>
  );
};

const CameraPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, roleCode, college } = route.params || {};

  const [isRecording, setIsRecording] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(0);
  const [onFlash, setOnFlash] = useState('off');
  const [videoPath, setVideoPath] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [showJobIdPrompt, setShowJobIdPrompt] = useState(true);
  const [jobId, setJobId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);

  const cameraRef = useRef(null);
  const timerInterval = useRef(null);
  const device = useCameraDevice(isFrontCamera ? 'front' : 'back');

  useEffect(() => {
    const checkPermissions = async () => {
      const microphoneStatus = await Camera.getMicrophonePermissionStatus();
      setHasMicrophonePermission(microphoneStatus === 'granted');
    };
    checkPermissions();
  }, []);

  const showPermissionsAlert = () => {
    Alert.alert(
      'Permissions Required',
      'To record videos, this app needs access to your Camera and Microphone. Please grant permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleRequestPermission = useCallback(async () => {
    const cameraResult = await requestCameraPermission();
    if (!cameraResult) {
      showPermissionsAlert();
      return;
    }
    const microphoneResult = await Camera.requestMicrophonePermission();
    if (!microphoneResult) {
      showPermissionsAlert();
      return;
    }
    setHasMicrophonePermission(true);
  }, [requestCameraPermission]);

  const stopRecording = useCallback(async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (cameraRef.current && !isRecording) {
      setIsRecording(true);
      setCurrentTimer(0);
      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          setIsRecording(false);
          clearInterval(timerInterval.current);
          if (video && video.path) {
            if (video.duration >= 30) {
              setVideoPath(video.path);
              setShowPreview(true);
            } else {
              Alert.alert("Recording Too Short", `Please record for at least 30 seconds. Your video was only ${Math.round(video.duration)} seconds.`);
              setVideoPath(null);
              setCurrentTimer(0);
            }
          } else {
            Alert.alert('Error', 'Failed to save the recording. Please try again.');
          }
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          clearInterval(timerInterval.current);
        },
      });
      timerInterval.current = setInterval(() => {
        setCurrentTimer(prev => {
          if (prev >= 59) {
            clearInterval(timerInterval.current);
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);
    }
  }, [isRecording, stopRecording]);

  const handleUploadVideo = useCallback(async () => {
    if (!videoPath) {
      Alert.alert('Error', 'No video to upload.');
      return;
    }
    setShowPreview(false);
    setUploading(true);
    setUploadProgress(0);

    const randomFileName = `${Date.now()}.mp4`;
    const formattedUri = Platform.OS === 'android' ? `file://${videoPath}` : videoPath;

    try {
      const formData = new FormData();
      formData.append('file', { uri: formattedUri, type: 'video/mp4', name: randomFileName });
      formData.append('userId', String(userId));
      formData.append('jobId', String(jobId));
      formData.append('roleCode', String(roleCode));
      formData.append('college', String(college));

      const response = await apiClient.post(`/api/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(percent);
        },
      });

      if (response.data?.filePath && response.data?.id) {
        setUploadProgress(100);

        Alert.alert(
          'Success',
          'Video uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setUploading(false);
                setVideoPath(null);
                setCurrentTimer(0);
                
                const navParams = { userId, videos: [response.data] };
                navigation.navigate('Transcribe', navParams);
              }
            }
          ]
        );
      } else {
        throw new Error('Unexpected server response. Please check API output.');
      }
    } catch (error) {
      setUploading(false);
      console.error('Upload Error:', error.response ? error.response.data : error.message);
      Alert.alert('Upload Failed', 'There was an error uploading your video. Please try again.');
      setShowPreview(true);
    }
  }, [videoPath, userId, jobId, roleCode, college, navigation]);

  const handleRedo = () => {
    setShowPreview(false);
    setVideoPath(null);
    setCurrentTimer(0);
  };

  if (!device) {
    return <ActivityIndicator style={styles.container} color="#fff" size="large" />;
  }

  if (!hasCameraPermission || !hasMicrophonePermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permission.container}>
          {/* Replaced Icon with Emoji */}
          <Text style={styles.permission.emojiLarge}>{EMOJI_MAP.Lock}</Text> 
          <Text style={styles.permission.title}>Camera & Microphone Access</Text>
          <Text style={styles.permission.message}>
            To record videos with sound, this app needs access to both your camera and your microphone.
          </Text>
          <TouchableOpacity style={styles.permission.button} onPress={handleRequestPermission}>
             {/* Replaced Icon with Emoji (Not explicitly used in the original button, but added the unlock emoji for visual flair) */}
            <Text style={styles.permission.buttonText}>
              {EMOJI_MAP.Grant} Grant Permissions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <Camera
        ref={cameraRef}
        device={device}
        isActive={true}
        style={StyleSheet.absoluteFill}
        video={true}
        audio={true}
        torch={onFlash}
      />

      <View style={styles.topControls}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setOnFlash(f => f === 'off' ? 'on' : 'off')}>
          {/* Replaced Icon with Emoji */}
          <Text style={styles.emojiIcon}>
            {onFlash === 'off' ? EMOJI_MAP.FlashOff : EMOJI_MAP.FlashOn}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          {/* Replaced Icon with Emoji */}
          <Text style={styles.emojiIcon}>{EMOJI_MAP.Close}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setIsFrontCamera(p => !p)}>
          {/* Replaced Icon with Emoji */}
          <Text style={styles.emojiIconLarge}>{EMOJI_MAP.CameraFlip}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={isRecording ? styles.recordButtonActive : styles.recordButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {/* Replaced Icon with Emoji */}
          <Text style={isRecording ? styles.stopEmoji : styles.recordEmoji}>
            {isRecording ? EMOJI_MAP.Stop : EMOJI_MAP.Record}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => videoPath ? setShowPreview(true) : null} disabled={!videoPath}>
          {/* Replaced Icon with Emoji */}
          <Text style={[styles.emojiIconLarge, { opacity: videoPath ? 1 : 0.4 }]}>
            {EMOJI_MAP.PlayBox}
          </Text>
        </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{`00:${currentTimer.toString().padStart(2, '0')}`}</Text>
        </View>
      )}

      <Modal animationType="fade" visible={showPreview} transparent={true}>
        <View style={styles.modal.container}>
          <Text style={styles.modal.header}>Preview Video</Text>
          <View style={styles.modal.videoContainer}>
            <Video
              source={{ uri: Platform.OS === 'android' ? `file://${videoPath}` : videoPath }}
              style={styles.modal.videoPlayer}
              controls
              resizeMode="contain"
              repeat
            />
          </View>
          <View style={styles.modal.buttonContainer}>
            <TouchableOpacity style={styles.modal.button} onPress={handleRedo}>
              <View style={styles.modal.buttonInner}>
                {/* Replaced Icon with Emoji */}
                <Text style={styles.redoEmoji}>{EMOJI_MAP.Trash}</Text>
                <Text style={[styles.modal.buttonText, { color: '#FF5A5F' }]}>Redo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modal.button} onPress={handleUploadVideo}>
              <View style={styles.modal.buttonInner}>
                {/* Replaced Icon with Emoji */}
                <Text style={styles.uploadEmoji}>{EMOJI_MAP.Upload}</Text>
                <Text style={[styles.modal.buttonText, { color: '#00A699' }]}>Upload</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" visible={isUploading} transparent={true}>
        <View style={styles.upload.overlay}>
          <View style={styles.upload.contentBox}>
            {uploadProgress < 100 ? (
              <UploadProgressCircle progress={uploadProgress} />
            ) : (
              // Use ActivityIndicator for processing state
              <ActivityIndicator size="large" color="#fff" />
            )}
            <Text style={styles.upload.text}>
              {uploadProgress < 100 ? 'Uploading video...' : 'Processing video...'}
            </Text>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} animationType="fade" visible={showJobIdPrompt}>
        <View style={styles.jobId.container}>
          <View style={styles.jobId.content}>
            <Text style={styles.jobId.title}>Choose an ID</Text>
            <Text style={styles.jobId.text}>If you want to apply for a specific position, enter the Job ID below.</Text>
            <TextInput placeholder="Enter Job ID (optional)" placeholderTextColor="#000000" value={jobId} onChangeText={setJobId} style={styles.jobId.input} />
            <View style={styles.jobId.buttonContainer}>
              <TouchableOpacity onPress={() => { setShowJobIdPrompt(false); setJobId(''); }} style={[styles.jobId.button, styles.jobId.buttonSkip]}>
                <Text style={styles.jobId.buttonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJobIdPrompt(false)} style={[styles.jobId.button, styles.jobId.buttonSubmit]}>
                <Text style={styles.jobId.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 50,
  },
  // --- NEW EMOJI STYLES ---
  emojiIcon: {
    fontSize: 20, // Matches the size=28 from original icons
    color: 'white',
  },
  emojiIconLarge: {
    fontSize: 20, // Matches the size=32 from original icons
    color: 'white',
  },
  // Recording button emojis
  stopEmoji: {
    fontSize: 20, // Matches the size=40 from original icons
    color: 'white',
    // Emojis often need slight vertical adjustment to center properly
    lineHeight: 40, 
  },
  recordEmoji: {
    fontSize: 20, // Slightly larger to match the visual feel of the original size=50 icon
    color: '#FF5A5F',
    // Emojis often need slight vertical adjustment to center properly
    lineHeight: 45,
  },
  // Modal button emojis
  redoEmoji: {
    fontSize: 28, // Matches the size=28 from original icons
    color: '#FF5A5F',
    lineHeight: 28,
  },
  uploadEmoji: {
    fontSize: 28, // Matches the size=28 from original icons
    color: '#00A699',
    lineHeight: 28,
  },
  // Permissions screen emoji
  permission: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1c1c1c',
      padding: 20,
    },
    emojiLarge: {
      fontSize: 80, // Matches the size=80 from original icon
      color: '#FFA500', // Matches the original color
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 20,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: '#ccc',
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
      marginTop: 30,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  },
  // --- END NEW EMOJI STYLES ---
  timerContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 65,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 10,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  recordButtonActive: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modal: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
    },
    header: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      position: 'absolute',
      top: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    },
    videoContainer: {
      width: '90%',
      height: '65%',
      borderRadius: 20,
      overflow: 'hidden',
    },
    videoPlayer: {
      width: '100%',
      height: '100%',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      position: 'absolute',
      bottom: 60,
    },
    button: {
      alignItems: 'center',
    },
    buttonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 15,
      ...Platform.select({
        ios: {},
        android: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
      }),
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
    },
  },
  upload: {
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    contentBox: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 30,
      borderRadius: 20,
      alignItems: 'center',
    },
    text: {
      color: 'white',
      fontSize: 18,
      marginTop: 20,
      fontWeight: '500',
    },
  },
  jobId: {
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    content: {
      width: '85%',
      backgroundColor: 'white',
      padding: 25,
      borderRadius: 15,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center'
    },
    text: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      color: '#000'
    },
    input: {
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      textAlign: 'center',
      color: '#000'
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    button: {
      paddingVertical: 12,
      borderRadius: 8,
      width: '48%',
      alignItems: 'center',
    },
    buttonSkip: {
      backgroundColor: '#A9A9A9',
    },
    buttonSubmit: {
      backgroundColor: '#007AFF',
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16
    },
  },

  container1: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundTrack: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#555',
    position: 'absolute',
  },
  progressLayer: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    position: 'absolute',
    // Note: clipPath is a web standard, but in React Native, this effect is often achieved with clever View stacking or platform-specific methods. Assuming your current solution is compatible with your RN environment.
  },
  progressSpinner: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_DIAMETER / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#00A699',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  innerCircle: {
    width: INNER_CIRCLE_DIAMETER,
    height: INNER_CIRCLE_DIAMETER,
    borderRadius: INNER_CIRCLE_DIAMETER / 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default CameraPage;