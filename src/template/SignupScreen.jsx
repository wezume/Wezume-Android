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
  View,
  Dimensions,
  ImageBackground
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import LinearGradient from 'react-native-linear-gradient';
// Removed: import UploadImage from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';
import env from './env';

// Note: Imports for Animated, useSharedValue, Gesture, etc., are removed.

const { width, height } = Dimensions.get('window'); // Keep Dimensions for sizing

const SignupScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobOption, setJobOption] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null); // For profile pic
  const [currentRole, setCurrentRole] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [experience, setExperience] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [languages, setLanguages] = useState(['']);
  const navigation = useNavigation();
  const [base64Image, setBase64Image] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchText, setIndustrySearchText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState(null);
  const [selectRole, setSelectRole] = useState('');
  const [iscollege, setisCollege] = useState([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false); // New state for upload status
  // showScrollIndicator state and related function removed

  // Unicode Emojis
  const UPLOAD_ICON = '⬆️'; // Up arrow emoji for upload
  const CHEVRON_DOWN = ' \u25BC'; // Black down-pointing triangle

  const experienceOptions = [
    { label: '  0-1 years', value: '0-1' },
    { label: '  1-3 years', value: '1-3' },
    { label: '  3-5 years', value: '3-5' },
    { label: '  5-10 years', value: '5-10' },
    { label: '  10-15 years', value: '10-15' },
    { label: '  15+ years', value: '10+' },
  ];

  // Logic for ScrollIndicator removed

  const fetchColleges = async (jobRole) => {
    console.log("Fetching colleges for job role:", jobRole);
    console.log(iscollege);


    try {
      setLoading(true);
      const response = await axios.get(`${env.baseURL}/api/auth/details/${jobRole}`);
      console.log("Response:", response.data); // This should show the expected data from the API

      // Update the state with the fetched college data
      setisCollege(response.data.colleges); // Assuming colleges is an array of objects
    } catch (error) {
      if (error.response) {
        console.error("API Error:", error.response.data);
        Alert.alert("Error", error.response.data.message || "Failed to fetch colleges.");
      } else {
        console.error("Network Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // REMOVED: rotateX, rotateY, translateX, translateY shared values.
  // REMOVED: panGesture and animatedStyle logic.

  // Note: animatedStyle reference is removed from the return block.

  console.log(selectedRoleCode);
  console.log(selectedCollege);

  // Trigger the fetchColleges function when selectRole changes
  useEffect(() => {
    if (selectRole === 'placementDrive' || selectRole === 'Academy') {
      fetchColleges(selectRole);
    }
  }, [selectRole]);

  // const filteredColleges = iscollege.filter(college =>
  //   college.college.toLowerCase().includes(searchText.toLowerCase()) // Access the 'college' field
  // );

  const cityOptions = [
    'New Delhi',
    'Mumbai',
    'Bengaluru ',
    'Chennai ',
    'Hyderabad ',
    'Pune ',
    'Kolkata ',
    // Add more cities here
  ];
  const industries = [
    'Banking & Finance',
    'Biotechnology',
    'Construction',
    'Consumer Goods',
    'Education',
    'Energy',
    'Healthcare',
    'Media & Entertainment',
    'Hospitality',
    'Information Technology (IT)',
    'Insurance',
    'Manufacturing',
    'Non-Profit',
    'Real Estate',
    'Retail',
    'Transportation',
    'Travel & Tourism',
    'Textiles',
    'Logistics & Supply Chain',
    'Sports',
    'E-commerce',
    'Consulting',
    'Advertising & Marketing',
    'Architecture',
    'Arts & Design',
    'Environmental Services',
    'Human Resources',
    'Legal',
    'Management',
    'Telecommunications',
    // Add more industries as needed
  ];



  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(100), (val, index) => currentYear - index);
  const addLanguageField = () => {
    if (languages.length < 3) {
      setLanguages([...languages, '']);
    }
  };
  const filteredIndustries = industries.filter(industry =>
    industry.toLowerCase().includes(industrySearchText.toLowerCase()),
  );
  const toggleIndustryDropdown = () =>
    setIsIndustryDropdownOpen(!isIndustryDropdownOpen);
  const selectIndustry = selectedIndustry => {
    setIndustry(selectedIndustry);
    setIsIndustryDropdownOpen(false);
  };
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectCity = cityName => {
    setCity(cityName);
    setIsDropdownOpen(false); // Close dropdown after selection
    setSearchText(''); // Clear search text
  };

  const filteredCities = cityOptions.filter(cityName =>
    cityName.toLowerCase().includes(searchText.toLowerCase()),
  );
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

    if (password !== confirmPassword) {
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

  const handleSignup = async () => {
    if (!validateInputs()) {
      return;
    }

    // Check if email is already taken
    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      Alert.alert('Validation Error', 'Email is already registered!');
      return;
    }

    // Check for public domain email if jobOption is "employer"
    if (jobOption === 'Employer') {
      const isPublicEmail = await checkIfPublicEmail(email);
      if (isPublicEmail) {
        Alert.alert(
          'Validation Error',
          'Employers must use a company email, not a public domain email!',
        );
        return;
      }
    }

    // Check if phone number is already taken
    const phoneExists = await checkIfPhoneExists(phoneNumber);
    if (phoneExists) {
      Alert.alert('Validation Error', 'Phone number is already registered!');
      return;
    }

    // *** START MODIFICATION: Create FormData object ***
    const formData = new FormData();

    // Append all text fields. The keys must match the @RequestParam names on the backend.
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('jobOption', jobOption);
    formData.append('password', password);
    formData.append('currentRole', currentRole);
    formData.append('keySkills', keySkills);
    formData.append('experience', experience);
    formData.append('industry', industry);
    formData.append('city', city);
    formData.append('currentEmployer', currentEmployer);
    formData.append('college', selectedCollege);
    formData.append('jobId', selectedRoleCode);

    setLoading(true);
    console.log("FormData being sent to the server:", formData);

    try {
      const response = await axios.post(
        `${env.baseURL}/api/users/signup/user`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      Alert.alert(
        'Success',
        'Registration successful! Please check your email for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              // ... navigation and state resets ...
              navigation.navigate('LoginScreen');
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhoneNumber('');
              setJobOption('');
              setPassword('');
              setConfirmPassword('');
              setProfilePic(null);
              setCurrentRole('');
              setKeySkills('');
              setExperience('');
              setCity('');
              setIndustry('');
              setCurrentEmployer('');
              setisCollege('');
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        'Signup failed:',
        error.response ? error.response.data : error.message,
      );
      Alert.alert(
        'Signup failed',
        error.response ? error.response.data.message : error.message,
      );
    } finally {
      setLoading(false);
    }
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

  const checkIfPublicEmail = async () => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-Recruteremail`,
        { email },
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (response.data.error === 'Public email domains are not allowed') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking public email:', error);
      return false;
    }
  };

  const checkIfPhoneExists = async (phoneNumber) => {
    try {
      const response = await axios.post(
        `${env.baseURL}/users/check-phone`,
        phoneNumber,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
  };

  const handleProfilePic = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async response => {
      if (response.didCancel) {
        setIsImageUploaded(false); // Reset if canceled
      } else if (response.errorMessage) {
        console.error('ImagePicker error: ', response.errorMessage);
        setIsImageUploaded(false); // Reset on error
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        try {
          const base64String = await RNFS.readFile(imageUri, 'base64');
          const cleanBase64String = base64String.replace(
            /^data:image\/\w+;base64,/,
            '',
          );
          setBase64Image(cleanBase64String);
          setIsImageUploaded(true); // Set to true when image is successfully uploaded
        } catch (error) {
          console.error('Error converting image to Base64: ', error);
          setIsImageUploaded(false); // Reset on error
        }
      }
    });
  };

  // REMOVED: handleScroll function

  return (
    <ImageBackground
      style={styles.backgroundImage}
      source={require('./assets/Background-01.jpg')}
      resizeMode="cover">
      <View style={styles.glassContainer}>
        <Image style={styles.img2} source={require('./assets/logopng.png')} />
        <Text style={styles.title}>SignUp</Text>
        {/* scrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ height: '40%', width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
          {/* <Text style={styles.loginsub}>Create an account so you can explore all the existing jobs.</Text> */}
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
              onValueChange={itemValue => setJobOption(itemValue)}>
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Scroll to select your role"
                value=""
              />
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Employer"
                value="Employer"
              />
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Freelancer"
                value="Freelancer"
              />
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Employee"
                value="Employee"
              />
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Entrepreneur"
                value="Entrepreneur"
              />
              <Picker.Item
                style={{ fontSize: 16 }}
                label="  Investor"
                value="Investor"
              />
            </Picker>
          </View>
          {/* Role-specific fields */}
          {jobOption === 'Employee' && (
            <>
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
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TextInput
                style={styles.input}
                placeholder="Current Role"
                placeholderTextColor="#000"
                value={currentRole}
                onChangeText={setCurrentRole}
              />

              <TextInput
                style={styles.input}
                placeholder="Key Skills"
                placeholderTextColor="#000"
                value={keySkills}
                onChangeText={setKeySkills}
              />
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={experience}
                  onValueChange={itemValue => setExperience(itemValue)}
                  style={styles.picker}>
                  <Picker.Item label="  Select Experience" value="" />
                  {experienceOptions.map(option => (
                    <Picker.Item
                      label={option.label}
                      value={option.value}
                      key={option.value}
                    />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          {/* Role-specific fields */}
          {jobOption === 'Freelancer' && (
            <>
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
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TextInput
                style={styles.input}
                placeholder="Current Role"
                placeholderTextColor="#000"
                value={currentRole}
                onChangeText={setCurrentRole}
              />
              <TextInput
                style={styles.input}
                placeholder="Key Skills"
                placeholderTextColor="#000"
                value={keySkills}
                onChangeText={setKeySkills}
              />
              <Picker
                selectedValue={experience}
                onValueChange={itemValue => setExperience(itemValue)}
                style={styles.picker}>
                <Picker.Item label="  Select Experience" value="" />
                {experienceOptions.map(option => (
                  <Picker.Item
                    label={option.label}
                    value={option.value}
                    key={option.value}
                  />
                ))}
              </Picker>
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          {jobOption === 'Entrepreneur' && (
            <>
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
              <TextInput
                style={styles.input}
                placeholder="Organization Name"
                placeholderTextColor="#000"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
              />
              <TextInput
                style={styles.input}
                placeholder="Current Role"
                placeholderTextColor="#000"
                value={currentRole}
                onChangeText={setCurrentRole}
              />
              <TextInput
                style={styles.input}
                placeholder="Key Skills"
                placeholderTextColor="#000"
                value={keySkills}
                onChangeText={setKeySkills}
              />
              <TouchableOpacity
                onPress={toggleIndustryDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {industry || 'Select Industry'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Industry Dropdown Content */}
              {isIndustryDropdownOpen && (
                <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search industry"
                    placeholderTextColor="#666"
                    value={industrySearchText}
                    onChangeText={setIndustrySearchText}
                  />

                  {/* Scrollable List of Filtered Industries */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredIndustries.length > 0 ? (
                      filteredIndustries
                        .sort((a, b) => a.localeCompare(b))
                        .map(industryName => (
                          <TouchableOpacity
                            key={industryName}
                            onPress={() => selectIndustry(industryName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {industryName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <TouchableOpacity
                        onPress={() => selectIndustry('Others')}
                        style={styles.dropdownOption}>
                        <Text style={styles.dropdownOptionText}>Others</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}>
                <Text style={styles.dropdownButtonText}>
                  {city || 'Select City'}
                </Text>
                {/* Replaced icon with emoji */}
                <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
              </TouchableOpacity>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city"
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                  />

                  {/* Scrollable List of Filtered Cities */}
                  <ScrollView
                    style={styles.scrollView}
                    nestedScrollEnabled={true}>
                    {filteredCities.length > 0 ? (
                      // Display filtered cities in alphabetical order
                      filteredCities
                        .sort((a, b) => a.localeCompare(b))
                        .map(cityName => (
                          <TouchableOpacity
                            key={cityName}
                            onPress={() => selectCity(cityName)}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>
                              {cityName}
                            </Text>
                          </TouchableOpacity>
                        ))
                    ) : (
                      <>
                        {/* "Others" option */}
                        <TouchableOpacity
                          onPress={() => selectCity('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </>
          )}
          {/* Common fields for Employer/Investor/Academy/Placement Drive */}
          {(jobOption === 'Employer' ||
            jobOption === 'Investor' ||
            selectRole === 'Academy' ||
            selectRole === 'placementDrive') && (
              <>
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
                <TextInput
                  style={styles.input}
                  placeholder="Organization Name"
                  placeholderTextColor="#000"
                  value={currentEmployer}
                  onChangeText={setCurrentEmployer}
                />

                {/* Role-specific logic for Employer/Investor/Academy/Placement Drive */}
                {jobOption === 'Employer' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Current Role"
                    placeholderTextColor="#000"
                    value={currentRole}
                    onChangeText={setCurrentRole}
                  />
                )}
                {jobOption === 'Investor' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Investment Focus"
                    placeholderTextColor="#000"
                    value={keySkills}
                    onChangeText={setKeySkills}
                  />
                )}
                {(selectRole === 'Academy' ||
                  selectRole === 'placementDrive') && (
                    <TextInput
                      style={styles.input}
                      placeholder="Academy/Placement Drive Name"
                      placeholderTextColor="#000"
                      value={currentEmployer}
                      onChangeText={setCurrentEmployer}
                    />
                  )}

                {/* Industry selection for all non-Employee roles */}
                <TouchableOpacity
                  onPress={toggleIndustryDropdown}
                  style={styles.dropdownButton}>
                  <Text style={styles.dropdownButtonText}>
                    {industry || 'Select Industry'}
                  </Text>
                  {/* Replaced icon with emoji */}
                  <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
                </TouchableOpacity>

                {/* Industry Dropdown Content */}
                {isIndustryDropdownOpen && (
                  <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
                    {/* Search Input */}
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search industry"
                      placeholderTextColor="#666"
                      value={industrySearchText}
                      onChangeText={setIndustrySearchText}
                    />

                    {/* Scrollable List of Filtered Industries */}
                    <ScrollView
                      style={styles.scrollView}
                      nestedScrollEnabled={true}>
                      {filteredIndustries.length > 0 ? (
                        filteredIndustries
                          .sort((a, b) => a.localeCompare(b))
                          .map(industryName => (
                            <TouchableOpacity
                              key={industryName}
                              onPress={() => selectIndustry(industryName)}
                              style={styles.dropdownOption}>
                              <Text style={styles.dropdownOptionText}>
                                {industryName}
                              </Text>
                            </TouchableOpacity>
                          ))
                      ) : (
                        <TouchableOpacity
                          onPress={() => selectIndustry('Others')}
                          style={styles.dropdownOption}>
                          <Text style={styles.dropdownOptionText}>Others</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}

                <TouchableOpacity
                  onPress={toggleDropdown}
                  style={styles.dropdownButton}>
                  <Text style={styles.dropdownButtonText}>
                    {city || 'Select City'}
                  </Text>
                  {/* Replaced icon with emoji */}
                  <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
                </TouchableOpacity>

                {/* City Dropdown Content */}
                {isDropdownOpen && (
                  <View style={styles.dropdownContainer}>
                    {/* Search Input */}
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search city"
                      placeholderTextColor="#666"
                      value={searchText}
                      onChangeText={setSearchText}
                    />

                    {/* Scrollable List of Filtered Cities */}
                    <ScrollView
                      style={styles.scrollView}
                      nestedScrollEnabled={true}>
                      {filteredCities.length > 0 ? (
                        // Display filtered cities in alphabetical order
                        filteredCities
                          .sort((a, b) => a.localeCompare(b))
                          .map(cityName => (
                            <TouchableOpacity
                              key={cityName}
                              onPress={() => selectCity(cityName)}
                              style={styles.dropdownOption}>
                              <Text style={styles.dropdownOptionText}>
                                {cityName}
                              </Text>
                            </TouchableOpacity>
                          ))
                      ) : (
                        <>
                          {/* "Others" option */}
                          <TouchableOpacity
                            onPress={() => selectCity('Others')}
                            style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>Others</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </ScrollView>
                  </View>
                )}
                {/* Select Role for Academy/Placement Drive */}
                {(selectRole === 'Academy' ||
                  selectRole === 'placementDrive') && (
                    <>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={selectedRoleCode}
                          onValueChange={itemValue =>
                            setSelectedRoleCode(itemValue)
                          }
                          style={styles.picker}>
                          <Picker.Item
                            label="  Select Academy/Placement Role"
                            value={null}
                          />
                          <Picker.Item label="  Admin" value="admin" />
                          <Picker.Item label="  HR" value="hr" />
                          <Picker.Item label="  Faculty" value="faculty" />
                        </Picker>
                      </View>
                      {/* College Search/Dropdown for Academy/Placement Drive */}
                      <TouchableOpacity
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={styles.dropdownButton}>
                        <Text style={styles.dropdownButtonText}>
                          {selectedCollege || 'Select College'}
                        </Text>
                        {/* Replaced icon with emoji */}
                        <Text style={styles.dropdownIcon}>{CHEVRON_DOWN}</Text>
                      </TouchableOpacity>
                      {/* College Dropdown Content */}
                      {isDropdownOpen && (
                        <View style={[styles.dropdownContainer, { maxHeight: 200 }]}>
                          {/* Search Input */}
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search College"
                            placeholderTextColor="#666"
                            value={searchText}
                            onChangeText={setSearchText}
                          />

                          {/* Scrollable List of Filtered Colleges */}
                          <ScrollView
                            style={styles.scrollView}
                            nestedScrollEnabled={true}>
                            {filteredColleges.length > 0 ? (
                              filteredColleges
                                .sort((a, b) =>
                                  a.college.localeCompare(b.college),
                                )
                                .map(college => (
                                  <TouchableOpacity
                                    key={college.collegeId}
                                    onPress={() => {
                                      setSelectedCollege(college.college);
                                      setIsDropdownOpen(false);
                                    }}
                                    style={styles.dropdownOption}>
                                    <Text style={styles.dropdownOptionText}>
                                      {college.college}
                                    </Text>
                                  </TouchableOpacity>
                                ))
                            ) : (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedCollege('Others');
                                  setIsDropdownOpen(false);
                                }}
                                style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>
                                  Others
                                </Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
              </>
            )}
          {/* Profile Picture Upload Section (Common) */}
          <TouchableOpacity
            onPress={handleProfilePic}
            style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>
              {isImageUploaded ? 'Profile Picture Uploaded ' : 'Upload Profile Picture '}
            </Text>
            {/* Replaced icon with emoji */}
            <Text style={styles.uploadIcon}>{isImageUploaded ? '✅' : UPLOAD_ICON}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSignup}
            disabled={loading}>
            <LinearGradient
              colors={['#70bdff', '#2e80d8']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>SIGN UP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('LoginScreen')}
            style={{ paddingVertical: 10 }}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.signupText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    width: width * 0.92,
    minHeight: height * 0.82,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },

  img2: {
    width: 180,
    height: 105,
    marginBottom: -15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 25,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(59, 130, 246, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  input: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderWidth: 1.5,
    padding: 15,
    marginBottom: 14,
    borderRadius: 15,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
    marginBottom: 14,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownIcon: { // New style for the emoji
    fontSize: 18,
    color: '#000',
  },
  dropdownContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
    color: '#000',
  },
  scrollView: {
    maxHeight: 150, // Limit height of the dropdown scroll list
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#000',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  uploadIcon: { // New style for the upload emoji
    fontSize: 20,
    marginLeft: 5,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 19,
    letterSpacing: 0.5,
  },
  footerText: {
    color: '#000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  signupText: {
    color: '#2e80d8',
    fontWeight: 'bold',
  },
});

export default SignupScreen;