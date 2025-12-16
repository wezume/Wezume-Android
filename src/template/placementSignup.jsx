import React, { useState, useEffect } from 'react';
import {
  Image,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  View,
  ImageBackground
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
import env from './env';

// Removed vector icon import
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// --- EMOJI COMPONENT AND DEFINITIONS ---
const Emoji = ({ unicode, size = 30, color = '#fff', style }) => (
  <Text style={[{ fontSize: size, color: color }, style]}>{unicode}</Text>
);

const EMOJI = {
  CHEVRON_DOWN: '\u25BC', // ▼ Downwards Black Triangle (Good substitute for chevron-down)
};
// ----------------------------------------

const PlacemenntSignup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobOption, setJobOption] = useState('');
  const [jobid, setJobId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [college, setCollege] = useState('');
  const navigation = useNavigation();
  const [branch, setBranch] = useState(''); // Renamed from city to branch
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  // Gesture handler for the tilt effect

  const ScrollIndicator = () => {
    const translateY = useSharedValue(0);

    useEffect(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        true
      );
    }, [translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <Animated.View style={[styles.scrollIndicator, animatedStyle]}>
        {/* Replaced Icon component with Emoji component */}
        <Emoji unicode={EMOJI.CHEVRON_DOWN} size={25} color="rgba(0, 0, 0, 0.5)" />
      </Animated.View>
    );
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateY.value = interpolate(
        event.translationX,
        [-width / 2, width / 2],
        [-10, 10] // Tilt range in degrees
      );
      rotateX.value = interpolate(
        event.translationY,
        [-height / 2, height / 2],
        [10, -10] // Tilt range in degrees
      );
    })
    .onEnd(() => {
      // Reset rotation smoothly when gesture ends
      rotateX.value = withTiming(0, { duration: 500 });
      rotateY.value = withTiming(0, { duration: 500 });
    });

  // Animated style for the container
  const animatedStyle = useAnimatedStyle(() => {
    const rotateXvalue = `${rotateX.value}deg`;
    const rotateYvalue = `${rotateY.value}deg`;
    return {
      transform: [
        { perspective: 300 },
        { rotateX: rotateXvalue },
        { rotateY: rotateYvalue },
      ],
    };
  });

  const validateInputs = () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !jobOption ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Validation Error', 'All fields are required!');
      return false;
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Invalid email format!');
      return false;
    }

    // Trim the password and confirmPassword to ensure no hidden spaces are causing a mismatch
    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Passwords do not match!');
      return false;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid 10-digit phone number!',
      );
      return false;
    }

    return true;
  };
  const checkIfEmailExists = async (email) => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-email`,
        { email }, // Wrapping email in an object
        { headers: { 'Content-Type': 'application/json' } },
      );
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleSignup = async () => {
    console.log("Password:", password);
    console.log("Confirm Password:", confirmPassword);

    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      Alert.alert('Validation Error', 'Email is already registered as user');
      return;
    }
    // Check if confirmPassword is empty
    if (!confirmPassword) {
      Alert.alert('Validation Error', 'Confirm Password cannot be empty!');
      return;
    }

    if (!validateInputs()) {
      return;
    }
    const userData = {
      // Use the exact lowercase names your backend expects
      firstname: firstName,
      lastname: lastName,
      jobid: jobid,

      // These fields are already correct
      email,
      phoneNumber,
      jobOption,
      branch,
      password,
      confirmPassword,
      college,
    };

    setLoading(true);
    try {
      const response = await axios.post(
        `${env.baseURL}/api/auth/signup/placement`,
        userData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );
      Alert.alert(
        'Success',
        'Registration successful! Please check your email for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to LoginScreen and reset form fields
              navigation.navigate('LoginScreen');
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhoneNumber('');
              setJobOption('');
              setPassword('');
              setConfirmPassword('');
              setJobId('');
              setBranch(''); // Reset branch as well
              setCollege('');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Signup failed:',
        error.response ? error.response.data : error.message
      );
      Alert.alert(
        'Signup Error',
        error.response ? error.response.data : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Define a small padding to trigger the hide action just before hitting the absolute bottom
    const paddingToBottom = 20;

    // This is true if the user has scrolled to the bottom
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    // This is true if the user has scrolled away from the top
    const isScrolledFromTop = contentOffset.y > 50;

    // If the user is at the bottom OR has scrolled from the top, hide the indicator
    if (isCloseToBottom || isScrolledFromTop) {
      if (showScrollIndicator) {
        setShowScrollIndicator(false);
      }
    } else {
      // Otherwise, show it
      if (!showScrollIndicator) {
        setShowScrollIndicator(true);
      }
    }
  };


  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode="cover">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.glassContainer, animatedStyle]}>
            <Image style={styles.img2} source={require('./assets/logopng.png')} />
            <Text style={styles.title}>SignUp</Text>
            {/* scrollView */}
            <ScrollView
              onScroll={handleScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
              style={{ height: '40%', width: '100%' }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor="#000"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#000"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#000"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#000"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={jobOption}
                  style={styles.picker}
                  onValueChange={(itemValue) => setJobOption(itemValue)}>
                  <Picker.Item
                    style={{ fontSize: 16 }}
                    label="  Scroll to select your role"
                    value=""
                  />
                  <Picker.Item
                    style={{ fontSize: 16 }}
                    label="  Placement Officer"
                    value="placementDrive"
                  />
                  <Picker.Item
                    style={{ fontSize: 16 }}
                    label="  Academy Manager"
                    value="Academy"
                  />
                </Picker>
              </View>
              {/* Changed the label and value to branch */}
              <TextInput
                style={styles.input}
                placeholder="Branch"
                placeholderTextColor="#000"
                value={branch} // Changed from city to branch
                onChangeText={setBranch}
              />
              <TextInput
                style={styles.input}
                placeholder="College or Academy Name"
                placeholderTextColor="#000"
                value={college}
                onChangeText={setCollege}
              />
              <TextInput
                style={styles.input}
                placeholder="Job Id"
                placeholderTextColor="#000"
                value={jobid}
                onChangeText={setJobId}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#000"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#000"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </ScrollView>
            {showScrollIndicator && <ScrollIndicator />}
            {loading ? (
              <ActivityIndicator size="large" color="#0077B5" style={styles.loadingIndicator} />
            ) : (
              <LinearGradient colors={['#70bdff', '#2e80d8']} style={styles.btn}>
                <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                  <Text style={styles.signupButtonText}>SignUp</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.logAccount}>
                Already have an account? <Text style={{ color: 'blue' }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  glassContainer: {
    width: '92%',
    height: '82%',
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    marginTop: '20%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },

  img2: {
    width: 190,
    height: 95,
    alignSelf: 'center',
    marginBottom: 5,
    marginTop: -25,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: '6%',
    marginTop: '-12%',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(59, 130, 246, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  input: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    padding: 16,
    marginBottom: 16,
    borderRadius: 15,
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 16,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  picker: {
    color: '#1e293b',
    height: 55,
    justifyContent: 'center',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#0077B5',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButtonSuccess: {
    backgroundColor: '#28a745',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  loadingIndicator: {
    paddingVertical: 15,
    marginVertical: 10,
  },
  btn: {
    width: '75%',
    alignSelf: 'center',
    borderRadius: 18,
    elevation: 10,
    marginTop: 25,
    marginBottom: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  signupButton: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 19,
    letterSpacing: 0.5,
  },
  logAccount: {
    marginTop: 22,
    textAlign: 'center',
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 15,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1.5,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 180,
    marginTop: -5,
    marginBottom: 10,
    elevation: 3,
  },
  searchInput: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  scrollView: {
    maxHeight: 120,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '400',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#888',
    padding: 15,
    fontSize: 15,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: '22%',
    alignSelf: 'center',
    opacity: 1,
    // Add margin/padding to center the smaller emoji icon
    padding: 8,
  },
});

export default PlacemenntSignup;