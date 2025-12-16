import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text, // Used for emojis
  ActivityIndicator,
  ImageBackground,
  Alert,
  BackHandler,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Header from './header';
import Video from 'react-native-video';
// Removed: DeleteIcon, ShareIcon, UploadIcon, PlayIcon imports
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import apiClient from './api';
import env from './env';

// --- API Service (Remains the same) ---
const apiService = {
  fetchVideo: (userId) => apiClient.get(`/api/videos/user/${userId}`),
  fetchSubtitles: (videoId) => apiClient.get(`/api/videos/user/${videoId}/subtitles.srt`),
  deleteVideo: (userId) => apiClient.delete(`/api/videos/delete/${userId}`),
  analyzeAudio: (videoId, audioUrl) => apiClient.get(`/api/audio/analyze`, { params: { videoId, filePath: audioUrl } }),
  checkProfanity: (videoUrl) => apiClient.post(`/api/videos/check-profane`, { file: videoUrl }),
  getFacialScore: (videoId, videoUrl) => apiClient.get(`/api/facial-score`, { params: { videoId, url: videoUrl } }),
};

// --- Subtitle Parser (Remains the same) ---
const parseSRT = (srtText) => {
    if (!srtText || typeof srtText !== 'string') return [];
    const subtitleBlocks = srtText.trim().replace(/\r/g, '').split('\n\n');
    return subtitleBlocks.map(block => {
      const lines = block.split('\n');
      if (lines.length < 2) return null;
      const timeString = lines[1];
      const text = lines.slice(2).join(' ');
      const timeParts = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeParts) return null;
      const timeToSeconds = (h, m, s, ms) => parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
      const startTime = timeToSeconds(timeParts[1], timeParts[2], timeParts[3], timeParts[4]);
      const endTime = timeToSeconds(timeParts[5], timeParts[6], timeParts[7], timeParts[8]);
      return { startTime, endTime, text };
    }).filter(Boolean);
};

// --- Sub-components ---

const VideoPlayer = ({ videoUri, subtitles }) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const currentSubtitle = subtitles.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime)?.text || '';

  return (
    <TouchableOpacity style={styles.videoCard} activeOpacity={1} onPress={() => setIsPaused(!isPaused)}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.videoPlayer}
        resizeMode="contain"
        controls={false}
        onProgress={(e) => setCurrentTime(e.currentTime)}
        repeat={true}
        paused={isPaused}
        preferredForwardBufferDuration={2}
      />
      {isPaused && (
        <View style={styles.playPauseOverlay}>
          {/* Replaced PlayIcon with emoji */}
          <Text style={styles.emojiIconLarge}>▶️</Text>
        </View>
      )}
      {currentSubtitle ? (
        <Text style={styles.subtitle}>{currentSubtitle}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const ActionButtons = ({ onShare, onDelete, isDisabled }) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.actionButton} onPress={onShare} disabled={isDisabled}>
      {/* Replaced ShareIcon with emoji */}
      <Text style={styles.emojiIconSmall}>🔗</Text> 
      <Text style={styles.actionButtonText}>Share</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onDelete}
      disabled={isDisabled}>
      {/* Replaced DeleteIcon with emoji */}
      <Text style={styles.emojiIconSmall}>🗑️</Text>
      <Text style={styles.actionButtonText}>Delete</Text>
    </TouchableOpacity>
  </View>
);

const NoVideoContent = ({ onUploadPress }) => (
  <View style={styles.noVideoContainer}>
    <View style={styles.noVideoCard}>
      <Text style={styles.noVideoTitle}>Upload Your Profile Video</Text>
      <Text style={styles.noVideoInstructions}>
        • Hold your phone in portrait mode.
        {'\n'}• Ensure your video is at least 30 seconds.
        {'\n'}• Review your transcription before uploading.
      </Text>
      <TouchableOpacity style={styles.uploadButton} onPress={onUploadPress}>
        {/* Replaced UploadIcon with emoji */}
        <Text style={styles.emojiIconSmallWhite}>☁️</Text>
        <Text style={styles.uploadButtonText}>Upload Video</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// --- Main Component (Remains the same as fixed version) ---

const Home1 = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  // HOOKS: All hooks defined unconditionally at the top
  const [loading, setLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [subtitles, setSubtitles] = useState([]);

  const analysisTriggered = useRef(false);
  
  const userId = userData?.userId;

  // useCallback: Perform Delete
  const performDelete = useCallback(async () => {
    if (!userId) return;
    try {
      await apiService.deleteVideo(userId);
      await AsyncStorage.multiRemove(['videoId', 'cachedVideoData']);
      
      setHasVideo(false);
      setVideoUri(null);
      setVideoId(null);
      setSubtitles([]);

      navigation.reset({ index: 0, routes: [{ name: 'home1' }] });
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'Could not delete the video.');
    }
  }, [userId, navigation]);

  // useCallback: Handle Profanity
  const handleProfanityDetected = useCallback(() => {
    Alert.alert("Profanity Detected", "This video must be deleted.",
      [{ text: 'Delete Video', onPress: performDelete, style: 'destructive' }],
      { cancelable: false }
    );
  }, [performDelete]);

  // useCallback: Run Analysis
  const runAnalysis = useCallback(async () => {
    if (!videoId || !videoUri || !audioUri) return;
    try {
      await Promise.allSettled([
        apiService.checkProfanity(videoUri),
        apiService.getFacialScore(videoId, videoUri),
        apiService.analyzeAudio(videoId, audioUri),
      ]);
    } catch (error) {
      if (error.response?.status === 403) {
        handleProfanityDetected();
      } else {
        console.error('ANALYSIS Error:', error.message);
      }
    }
  }, [videoId, videoUri, audioUri, handleProfanityDetected]);

  // useCallback: Fetch Video and Subtitles
  const fetchVideoAndSubtitles = useCallback(async (currentUserId) => {
    if (!currentUserId) return;
    try {
      const { data: videoData } = await apiService.fetchVideo(currentUserId);
      
      setVideoUri(videoData.videoUrl);
      setAudioUri(videoData.audiourl);
      setVideoId(videoData.id);
      setThumbnail(videoData.tumbnail);
      setHasVideo(true);

      await AsyncStorage.setItem('cachedVideoData', JSON.stringify(videoData));

      try {
        const { data: subtitlesData } = await apiService.fetchSubtitles(videoData.id);
        const parsedSubtitles = parseSRT(subtitlesData);
        setSubtitles(parsedSubtitles);
      } catch (subError) {
        setSubtitles([]);
      }

    } catch (error) {
      if (error.response?.status === 404) {
        setHasVideo(false);
        setVideoUri(null);
        setVideoId(null);
        setSubtitles([]);
        await AsyncStorage.removeItem('cachedVideoData');
      } else {
        console.error('Error fetching video:', error);
      }
    }
  }, []);

  // useCallback: Delete Button Press
  const handleDeletePress = useCallback(() => {
    Alert.alert('Delete Video', 'Are you sure?',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: performDelete }]
    );
  }, [performDelete]);

  // useCallback: Share Option
  const shareOption = useCallback(async () => {
    try {
      const thumbnailUrl = thumbnail;
      const localThumbnailPath = `${RNFS.CachesDirectoryPath}/thumbnail.jpg`;

      const downloadResult = await RNFS.downloadFile({
        fromUrl: thumbnailUrl,
        toFile: localThumbnailPath,
      }).promise;

      if (downloadResult.statusCode === 200) {
        const shareOptions = {
          title: 'Share User Video',
          message: `Check out this video shared by ${userData?.firstName}\n\n${env.baseURL}/users/share?target=app://api/videos/user/${videoUri}/${videoId}`,
          url: `file://${localThumbnailPath}`,
        };
        await Share.open(shareOptions);
      } else {
        Alert.alert('Error', 'Unable to download the thumbnail for sharing.');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to prepare video for sharing.');
    }
  }, [thumbnail, userData?.firstName, videoUri, videoId]);

  // useEffect 1: Load User Data and Initial Video Fetch
  useEffect(() => {
    const loadData = async () => {
      const storedUserData = {
        firstName: await AsyncStorage.getItem('firstName'),
        userId: await AsyncStorage.getItem('userId'),
        roleCode: await AsyncStorage.getItem('roleCode'),
        college: await AsyncStorage.getItem('college'),
      };
      
      const cachedProfileImage = await AsyncStorage.getItem('profileUrl');
      
      if (storedUserData.userId) {
        setUserData(storedUserData);
        setProfileImage(cachedProfileImage);
        fetchVideoAndSubtitles(storedUserData.userId);
      }
      
      setLoading(false);
    };

    if (isFocused) {
      loadData();
    }
  }, [isFocused, fetchVideoAndSubtitles]);

  // useEffect 2: Run Analysis when video data is available and component is focused
  useEffect(() => {
    if (videoId && videoUri && audioUri && isFocused && !analysisTriggered.current) {
      analysisTriggered.current = true;
      runAnalysis();
    }
  }, [videoId, videoUri, audioUri, isFocused, runAnalysis]);

  // useEffect 3: Hardware Back Button Handler
  useEffect(() => {
    const backAction = () => {
      if (isFocused) {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isFocused]);

  if (loading) {
    return (
      <ImageBackground source={require('./assets/login.jpg')} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </ImageBackground>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ImageBackground source={require('./assets/login.jpg')} style={styles.container}>
        <Header profile={profileImage} userName={userData?.firstName} />
        <View style={styles.content}>
          {hasVideo && videoUri ? (
            <>
              <VideoPlayer
                videoUri={videoUri}
                subtitles={subtitles}
              />
              <ActionButtons 
                onShare={shareOption} 
                onDelete={handleDeletePress} 
                isDisabled={!userId} 
              />
            </>
          ) : (
            <NoVideoContent
              onUploadPress={() =>
                navigation.navigate('CameraPage', {
                  userId: userData?.userId,
                  roleCode: userData?.roleCode,
                  college: userData?.college,
                })
              }
            />
          )}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 25,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoCard: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New style for the large play/pause emoji
  emojiIconLarge: {
    fontSize: 80, // Matches the size=80 from the old PlayIcon
    color: 'rgba(255, 255, 255, 0.7)',
  },
  subtitle: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 25,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // New style for the small action emojis
  emojiIconSmall: {
    fontSize: 22, // Matches the size=22 from the old icons
    color: '#fff', 
    // Emojis often sit higher than text, so a slight adjustment might be needed:
    // lineHeight: 22, 
  },
  // New style for the upload button emoji (if different color is needed)
  emojiIconSmallWhite: {
    fontSize: 22,
    color: '#fff',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  noVideoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  noVideoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  noVideoInstructions: {
    fontSize: 15,
    color: '#eee',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  uploadButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3498db',
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default Home1;