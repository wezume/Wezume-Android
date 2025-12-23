import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Alert,
  PermissionsAndroid,
  FlatList,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
// --- START: Change for new picker ---
import DocumentPicker, { types } from '@react-native-documents/picker';
// --- END: Change for new picker ---
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();

  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]); // Store chat messages
  const [isRecording, setIsRecording] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');
  const recordingPath = useRef(null);

  // v4.x exports a singleton instance by default.
  const audioRecorderPlayer = useRef(AudioRecorderPlayer);

  // Request permissions for Android
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        console.log('Permissions result:', grants);

        const audioGranted = grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
        const writeGranted = grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
        const readGranted = grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;

        if (audioGranted) {
          if (!writeGranted || !readGranted) {
            console.log('Storage permission denied (might be optional on Android 11+)');
          }
          return true;
        } else {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Request storage permissions specifically for document picking
  const requestStoragePermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version;
        console.log('Android API Level:', apiLevel);

        let permissionsToRequest = [];

        // Android 13+ (API 33+) uses granular media permissions
        if (apiLevel >= 33) {
          permissionsToRequest = [
            'android.permission.READ_MEDIA_IMAGES',
            'android.permission.READ_MEDIA_VIDEO',
            'android.permission.READ_MEDIA_AUDIO',
          ];
        } else {
          // Android 12 and below use READ_EXTERNAL_STORAGE
          permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ];
        }

        console.log('Requesting permissions:', permissionsToRequest);
        const grants = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        console.log('Storage permissions result:', grants);

        // Check if at least one permission was granted
        const hasAnyPermission = Object.values(grants).some(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!hasAnyPermission) {
          Alert.alert(
            'Storage Permission Required',
            'Please grant storage permissions to access documents.\n\nGo to Settings > Apps > vprofile > Permissions > Files and media > Allow',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  // On Android, we can't directly open app settings, but we can guide the user
                  Alert.alert('Manual Permission', 'Please go to:\nSettings > Apps > vprofile > Permissions > Files and media > Allow');
                }
              }
            ]
          );
          return false;
        }

        return true;
      } catch (err) {
        console.error('Permission request error:', err);
        Alert.alert('Error', 'Failed to request permissions. Please grant storage permissions manually in Settings.');
        return false;
      }
    }
    return true;
  };


  const handleVoiceRecord = async () => {
    if (!isRecording) {
      // Start recording
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      try {
        setGlobalLoading(true);
        setGlobalLoadingMessage('Starting recorder...');
        const path = Platform.select({
          ios: `${RNFS.CachesDirectoryPath}/recording.m4a`,
          android: undefined,
        });

        const result = await audioRecorderPlayer.current.startRecorder(path);
        recordingPath.current = result;
        setIsRecording(true);
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
        console.log('Recording started:', result);

        audioRecorderPlayer.current.addRecordBackListener((e) => {
          // optional metering or timer
        });
      } catch (error) {
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
        console.error('Failed to start recording:', error);
        Alert.alert('Error', 'Failed to start recording. Please try again.');
      }
    } else {
      // Stop recording and transcribe
      try {
        setGlobalLoading(true);
        setGlobalLoadingMessage('Stopping recorder...');
        const result = await audioRecorderPlayer.current.stopRecorder();
        audioRecorderPlayer.current.removeRecordBackListener();
        setIsRecording(false);
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
        console.log('Recording stopped:', result);

        // Start transcription
        transcribeAudio(result);
      } catch (error) {
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
        console.error('Failed to stop recording:', error);
      }
    }
  };

  const transcribeAudio = async (audioPath) => {
    try {
      setTranscribeLoading(true);
      setGlobalLoading(true);
      setGlobalLoadingMessage('Transcribing audio...');

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setTranscribeLoading(false);
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? audioPath : audioPath.replace('file://', ''),
        type: 'audio/wav',
        name: 'voice.wav',
      });
      formData.append('userId', userId);

      const response = await apiClient.post('/api/search/upload-voice-search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          return data;
        },
      });

      console.log('Voice search response:', response.data);

      const transcription = response.data; // Expecting string (transcription)
      if (typeof transcription === 'string') {
        setMessage(transcription);
      } else {
        setMessage(JSON.stringify(transcription));
      }

    } catch (error) {
      console.error('Voice search failed:', error);
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
        if (error.response.status === 403) {
          Alert.alert('Permission Error', 'You are not authorized. Please try logging out and logging in again.');
        }
      } else {
        console.error('Error Message:', error.message);
      }
      Alert.alert('Error', 'Voice transcription failed. Please check logs.');
    } finally {
      setTranscribeLoading(false);
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  };

  const pickDocument = async () => {
    try {
      console.log('Opening document picker...');

      // Check if we need to request storage permissions on Android
      if (Platform.OS === 'android') {
        const hasPermission = await requestStoragePermissions();
        if (!hasPermission) {
          console.log('Storage permissions denied');
          return;
        }
        console.log('Storage permissions granted');
      }


      console.log('Calling DocumentPicker.pick...');

      // Use pick with allowMultiSelection: false instead of pickSingle
      // Remove mode parameter as it may not be supported in all versions
      const results = await DocumentPicker.pick({
        type: [types.pdf, types.doc, types.docx, types.plainText],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
      });

      console.log('DocumentPicker returned:', JSON.stringify(results, null, 2));

      // pick returns an array, get the first item
      const res = Array.isArray(results) ? results[0] : results;

      if (!res) {
        console.log('DocumentPicker returned no result');
        Alert.alert('Info', 'No document was selected');
        return;
      }

      console.log('DocumentPicker result:', JSON.stringify(res, null, 2));

      // Prefer the copied file URI if available (fileCopyUri). Fallback to uri.
      const pickedUri = res.fileCopyUri || res.uri || null;

      if (!pickedUri) {
        console.error('No usable URI from document picker');
        Alert.alert('Error', 'Unable to access picked file. Try again.');
        return;
      }

      console.log('Picked URI:', pickedUri);

      // Normalize to file:// for Android if needed
      let uploadUri = pickedUri;
      if (Platform.OS === 'android' && !uploadUri.startsWith('file://') && !uploadUri.startsWith('content://')) {
        uploadUri = `file://${uploadUri}`;
      }

      // If content:// returned (rare when copyTo worked) try to fallback to fileCopyUri above,
      // but if still content://, we'll still pass it — server might accept content URIs with RNFS handling.
      const file = {
        uri: uploadUri,
        name: res.name || 'document',
        type: res.type || 'application/octet-stream',
      };

      console.log('Prepared file for upload:', JSON.stringify(file, null, 2));
      handleJDUpload(file);

    } catch (err) {
      // DocumentPicker throws a special object for cancellation
      if (DocumentPicker.isCancel && DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.error('DocumentPicker Error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        console.error('Error stack:', err.stack);
        Alert.alert(
          'Error Opening Document Picker',
          `Failed to open document picker. Error: ${err.message || 'Unknown error'}\n\nPlease check app permissions in Settings.`
        );
      }
    }
  };




  const handleJDUpload = async (file) => {
    try {
      setJdLoading(true);
      setGlobalLoading(true);
      setGlobalLoadingMessage('Extracting Job Description...');

      // Normalize uri for FormData on Android
      let uriForForm = file.uri;
      if (Platform.OS === 'android') {
        // If content:// URI (rare after copyTo), keep it — FormData may accept content URIs on Android.
        // But prefer file:// scheme for reliability.
        if (uriForForm && uriForForm.startsWith('content://')) {
          // try to use fileCopyUri earlier; if not available, we still send content:// and hope native handles it.
          console.warn('Uploading content:// URI. If upload fails, enable copyTo or upgrade picker.');
        } else if (uriForForm && !uriForForm.startsWith('file://')) {
          uriForForm = `file://${uriForForm}`;
        }
      } else {
        // iOS: remove file:// prefix if long; server often expects file:// removed for iOS, but both often work.
        if (uriForForm && uriForForm.startsWith('file://')) {
          // keep as-is (some servers accept file://). If you get issues, change to uriForForm.replace('file://', '')
        }
      }

      console.log('Uploading file URI used in FormData:', uriForForm);

      const formData = new FormData();
      formData.append('file', {
        uri: uriForForm,
        type: file.type || 'application/octet-stream',
        name: (file.name || 'file.pdf').replace(/[^a-zA-Z0-9.]/g, '_'),
      });

      // append userId if required by backend
      const userId = await AsyncStorage.getItem('userId');
      if (userId) formData.append('userId', userId);

      const response = await apiClient.post('/api/search/jd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data, headers) => data,
      });

      console.log('JD Extraction Response:', response.data);
      const { skills, description, title } = response.data || {};
      setMessage(`${title || ''}\n${skills || ''}\n${description || ''}`);

    } catch (error) {
      console.error('JD Upload Failed:', error);
      addMessage('Failed to extract JD.', 'system', false);
      Alert.alert('Error', 'Failed to extract information from the document. Check logs.');
    } finally {
      setJdLoading(false);
      setGlobalLoading(false);
      setGlobalLoadingMessage('');
    }
  };


  const handleFileUpload = () => {
    Alert.alert('Upload', 'Choose option', [
      { text: 'Camera', onPress: () => { } },
      { text: 'Gallery', onPress: () => { } },
      { text: 'Document (JD)', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  // addMessage now supports passing data + an onPress callback
  const addMessage = (text, type = 'text', isUser = true, data = null, onPress = null) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      type,
      isUser,
      data,
      onPress,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (message.trim()) {
      addMessage(message.trim(), 'text', true);
      const searchText = message.trim();
      setMessage('');
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        setSearchLoading(true);
        setGlobalLoading(true);
        setGlobalLoadingMessage('Searching videos...');

        console.log('Testing text search with:', searchText);
        const response = await apiClient.post('/api/search/voice', null, {
          params: {
            userId: userId,
            transcription: searchText
          }
        });
        console.log('Text Search Results:', response.data);

        const videos = Array.isArray(response.data) ? response.data : (response.data?.videos || []);
        if (Array.isArray(videos) && videos.length > 0) {
          // add a tappable message that navigates to FilteredVideos with the videos
          addMessage(
            `Found ${videos.length} video(s), click to view`,
            'video_results',
            false,
            videos,
            () => navigation.navigate('Filtered', { videos })
          );
        } else {
          addMessage('No video results found.', 'system', false);
        }

      } catch (error) {
        console.error('Text Search Failed:', error);
        if (error.response && error.response.status === 403) {
          Alert.alert('Auth Error', 'Text search also got 403. Please Logout & Login.');
        } else {
          Alert.alert('Error', 'Search failed. Check logs.');
        }
      } finally {
        setSearchLoading(false);
        setGlobalLoading(false);
        setGlobalLoadingMessage('');
      }
    }
  };

  const renderMessageItem = ({ item }) => {
    const BubbleWrapper = item.onPress ? TouchableOpacity : View;

    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.otherMessage,
        ]}
      >
        <BubbleWrapper
          activeOpacity={item.onPress ? 0.7 : 1}
          onPress={() => item.onPress && item.onPress()}
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.timestamp,
              item.isUser ? styles.userTimestamp : styles.otherTimestamp,
            ]}
          >
            {item.timestamp}
          </Text>
        </BubbleWrapper>
      </View>
    );
  };

  // Small helpers to disable UI while busy
  const isAnyLoading = jdLoading || transcribeLoading || searchLoading || globalLoading;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2c3e50', '#3498db']}
        style={styles.gradient}>

        {/* Logo - Background watermark */}
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('./assets/headlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Messages Area - Overlays on top */}
        <View style={styles.chatArea}>
          <FlatList
            data={chatMessages.slice().reverse()}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
          />
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleFileUpload}
              activeOpacity={0.7}
              disabled={isAnyLoading}>
              {jdLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <MaterialIcons name="attach-file" size={26} color="#3498db" />
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                editable={!isAnyLoading}
              />
            </View>

            {message.trim() ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSend}
                activeOpacity={0.7}
                disabled={searchLoading || isAnyLoading}>
                {searchLoading ? (
                  <View style={styles.sendGradient}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#70bdff', '#2e80d8']}
                    style={styles.sendGradient}>
                    <MaterialIcons name="send" size={22} color="#fff" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleVoiceRecord}
                activeOpacity={0.7}
                disabled={transcribeLoading || globalLoading}>
                <View style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}>
                  {transcribeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons
                      name={isRecording ? "stop" : "mic"}
                      size={26}
                      color={isRecording ? "#fff" : "#3498db"}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Full-screen modal loader */}
      <Modal visible={globalLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loaderText}>{globalLoadingMessage || 'Please wait...'}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  gradient: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    zIndex: 2,
  },
  messagesList: {
    padding: 15,
    paddingTop: '20%',
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logo: {
    width: 350,
    height: 320,
    opacity: 0.3,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  messageContainer: {
    marginBottom: 10,
    flexDirection: 'row',
    width: '100%',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0,0,0,0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: '-2%',
    minHeight: 64,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#e74c3c',
    transform: [{ scale: 1.05 }],
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Modal loader styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    width: 220,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default Profile;