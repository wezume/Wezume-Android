import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  Dimensions,
  Button,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation, // Make sure Extrapolation is imported
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { WebView } from 'react-native-webview'; // Always imported at the top
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from './env';

const { width, height } = Dimensions.get('window');

// Helper function moved outside the component for performance
const getQueryParams = (url) => {
  const params = {};
  const urlParts = url.split('?');
  if (urlParts.length > 1) {
    const queryString = urlParts[1];
    const pairs = queryString.split('&');
    pairs.forEach((pair) => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
  }
  return params;
};

const LoginScreen = () => {
  const navigation = useNavigation();

  // --- All Hooks are called unconditionally at the top level ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userData, setUserData] = useState(null);

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  // useMemo for URI
  const linkedInUri = useMemo(() => {
    return 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=869zn5otx0ejyt&redirect_uri=https://www.linkedin.com/developers/tools/oauth/redirect&scope=profile%20email%20openid';
  }, []);

  // useAnimatedStyle must be unconditional
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 300 },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  }, []);

  // --- useCallback functions ---
  const savePlacementLoginData = useCallback(async (userId, firstName, email, college, jobOption, profileUrl, jobid) => {
    try {
      const dataToSave = [
        ['userId', userId ? userId.toString() : ''],
        ['firstName', firstName || ''],
        ['email', email || ''],
        ['college', college || ''],
        ['jobOption', jobOption || ''],
        ['profileUrl', profileUrl || ''],
        ['jobid', jobid ? jobid.toString() : ''],
      ];
      await AsyncStorage.multiSet(dataToSave);
      console.log('✅ Placement data saved successfully.');
    } catch (error) {
      console.error('❌ Error saving PlacementLogin data to AsyncStorage:', error);
    }
  }, []);

  const saveStorage = useCallback(async (userId, firstName, email, jobOption, industry, videoId, college, profileUrl) => {
    try {
      const items = [
        ['userId', userId ? userId.toString() : ''],
        ['firstName', firstName || ''],
        ['email', email || ''],
        ['jobOption', jobOption || ''],
        ['industry', industry || ''],
        ['college', college || ''],
        ['profileUrl', profileUrl || ''],
      ];

      if (videoId) {
        items.push(['videoId', videoId.toString()]);
      } else {
        const existingVideoId = await AsyncStorage.getItem('videoId');
        if (existingVideoId !== null) {
          await AsyncStorage.removeItem('videoId');
        }
      }

      await AsyncStorage.multiSet(items);
      console.log('✅ User data saved successfully.');
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Both email and password are required!');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const loginResponse = await axios.post(`${env.baseURL}/api/login`, { email, password });
      const { token, jobOption } = loginResponse.data;

      if (!token) throw new Error('Login failed, token not received.');
      await AsyncStorage.setItem('userToken', token);

      const userDetailsResponse = await axios.get(`${env.baseURL}/api/user-detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userDetails = userDetailsResponse.data;
      if (!userDetails || !userDetails.userId) throw new Error('User data is incomplete.');

      const { userId, firstName, email: userEmail, industry, videos, college, profileUrl, jobid } = userDetails;
      const videoId = videos?.[0]?.videoId || null;
      const role = jobOption?.toLowerCase();

      if (['placementdrive', 'academy', 'placement'].includes(role)) {
        await savePlacementLoginData(userId, firstName, userEmail, college, jobOption, profileUrl, jobid);
        navigation.navigate('RoleSelection');
      } else {
        await saveStorage(userId, firstName, userEmail, jobOption, industry, videoId, college, profileUrl);

        switch (jobOption) {
          case 'Employee':
          case 'Entrepreneur':
          case 'Freelancer':
            navigation.navigate('home1');
            break;
          case 'Employer':
          case 'Investor':
            navigation.navigate('RecruiterDash');
            break;
          default:
            Alert.alert('Login Error', 'Unknown user role.');
            break;
        }
      }

      setEmail('');
      setPassword('');

    } catch (error) {
      console.error('--- LOGIN FAILED ---', error.response ? error.response.data : error.message);

      const status = error.response?.status;
      if (status === 401) {
        Alert.alert('Login Failed', 'The email or password you entered is incorrect.');
      } else if (status) {
        Alert.alert('Server Error', `Something went wrong on our end. Please try again later. (Status: ${status})`);
      } else {
        Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, savePlacementLoginData, saveStorage, navigation]);

  const handleWebViewNavigationStateChange = useCallback(async (navState) => {
    if (navState.url.includes('oauth/redirect')) {
      const params = getQueryParams(navState.url);
      const code = params.code;

      if (code) {
        setShowLinkedInModal(false);
        setLoading(true);
        try {
          const response = await axios.post(`${env.baseURL}/auth/linkedin`, { code });
          const { given_name, email, picture } = response.data;

          if (given_name && email && picture) {
            const userResponse = await axios.get(`${env.baseURL}/users/check`, { params: { email } });

            if (userResponse.data.exists) {
              const { userId, jobOption, firstName, profileUrl } = userResponse.data;
              await saveStorage(userId, firstName, email, jobOption, userResponse.data.industry, null, null, profileUrl);

              if (jobOption === 'Employer' || jobOption === 'Investor') {
                navigation.navigate('RecruiterDash');
              } else {
                navigation.navigate('home1');
              }
            } else {
              setUserData({ given_name, email, picture });
              setShowRoleSelection(true);
            }
          } else {
            Alert.alert('Error', 'User data is incomplete.');
          }
        } catch (error) {
          console.error('Error during LinkedIn login:', error.response?.data || error.message);
          Alert.alert('Login Failed', 'Could not retrieve user data.');
        } finally {
          setLoading(false);
        }
      }
    }
  }, [saveStorage, navigation]);

  const handleRoleSelect = useCallback(async (role) => {
    if (!userData) return;
    const { email, given_name } = userData;
    setLoading(true);

    try {
      await saveStorage(null, given_name, email, role, '', null, '', userData.picture);
      setShowRoleSelection(false);

      if (role === 'Employer' || role === 'Investor') {
        navigation.navigate('RecruiterDash');
      } else {
        navigation.navigate('home1');
      }
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      Alert.alert('Error', 'Could not select role.');
    } finally {
      setLoading(false);
    }
  }, [userData, saveStorage, navigation]);

  const handleLinkedInLogin = useCallback(() => {
    setShowLinkedInModal(true);
  }, []);

  // --- Pan Gesture definition (unconditional) ---
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateY.value = interpolate(event.translationX, [-width / 2, width / 2], [-10, 10], Extrapolation.CLAMP);
      rotateX.value = interpolate(event.translationY, [-height / 2, height / 2], [10, -10], Extrapolation.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withTiming(0, { duration: 300 });
      rotateY.value = withTiming(0, { duration: 300 });
    });

  // --- useEffect (unconditional) ---
  useEffect(() => {
    Alert.alert(
      'Wezume',
      'If you are a recruiter, please use your official email address.',
      [{ text: 'OK' }],
      { cancelable: false }
    );
  }, []);

  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode="cover">

      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.glassContainer, animatedStyle]}>
            <Image style={styles.img2} source={require('./assets/logopng.png')} />
            <Text style={styles.loginhead}>Login</Text>

            <TouchableOpacity
              style={styles.linkedinButton}
              onPress={handleLinkedInLogin}
              disabled={loading}
            >
              <Text style={styles.linkedinButtonText}>LinkedIn</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.horizontalLine} />
              <Text style={styles.dividerText}>or Login with</Text>
              <View style={styles.horizontalLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#333"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              underlineColorAndroid="transparent"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#333"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')} disabled={loading}>
              <Text style={styles.forgotPasswordText}>Forget Password ?</Text>
            </TouchableOpacity>

            <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.loginButtonGradient}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {/* Conditional rendering of UI elements (Text/ActivityIndicator) is fine */}
                {loading && email && password ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')} disabled={loading}>
              <Text style={styles.createAccount}>
                Don't Have An Account ? <Text style={{ color: '#0052cc' }}>SignUp</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('PlacemenntSignup')} disabled={loading}>
              <Text style={styles.createAccount}>
                Signup as placement officer? <Text style={{ color: '#0052cc' }}>Click Here</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* Full-screen loading overlay condition */}
      {loading && (!email || !password) && showLinkedInModal === false && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {/* Modal and its contents (WebView) are rendered conditionally based on state, not hooks */}
      <Modal
        visible={showLinkedInModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkedInModal(false)}
      >
        <View style={styles.modalContainer}>
          {showLinkedInModal && (
            <WebView
              source={{ uri: linkedInUri }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              style={{ flex: 1 }}
            />
          )}
          <Button title="Close" onPress={() => setShowLinkedInModal(false)} />
        </View>
      </Modal>

      <Modal
        visible={showRoleSelection}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoleSelection(false)}
      >
        <View style={styles.roleModalOverlay}>
          <View style={styles.roleSelectionContainer}>
            <Text style={styles.roleTitle}>Select Your Role</Text>
            {['Employer', 'Freelancer', 'Employee', 'Entrepreneur', 'Investor'].map((role) => (
              <TouchableOpacity
                key={role}
                style={styles.roleButton}
                onPress={() => handleRoleSelect(role)}>
                <Text style={styles.roleText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, justifyContent: 'center', width: '100%' },
  glassContainer: {
    width: '95%',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
    marginTop: '40%',
    alignSelf: 'center'
  },

  img2: { width: 150, height: 75, alignSelf: 'center', marginBottom: 10 },
  loginhead: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 20, marginTop: '-10%' },
  input: { backgroundColor: 'rgba(255, 255, 255, 1)', borderWidth: 0.3, padding: 12, marginBottom: 12, borderRadius: 10, borderColor: '#0387e0', color: '#000', fontSize: 16, fontWeight: '500' },
  forgotPasswordText: { color: '#000', textAlign: 'right', fontSize: 14, paddingBottom: 15, fontWeight: '600' },
  loginButtonGradient: { borderRadius: 10, elevation: 5, marginBottom: 15 },
  loginButton: { paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { fontWeight: 'bold', color: '#ffffff', fontSize: 18 },
  createAccount: { color: '#000', marginTop: 10, textAlign: 'center', fontWeight: '500', fontSize: 14 },
  linkedinButton: { backgroundColor: '#0077B5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  linkedinButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  horizontalLine: { flex: 1, height: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)' },
  dividerText: { marginHorizontal: 10, fontSize: 14, fontWeight: '500', color: '#333' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, marginTop: 50 },
  roleModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  roleSelectionContainer: { width: '85%', padding: 20, backgroundColor: 'white', borderRadius: 15, alignItems: 'center' },
  roleTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  roleButton: { padding: 15, marginVertical: 8, width: '100%', backgroundColor: '#2e80d8', borderRadius: 10, alignItems: 'center' },
  roleText: { fontSize: 18, color: '#ffffff', fontWeight: '600' },
});

export default LoginScreen;