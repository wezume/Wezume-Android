import React, { useEffect } from 'react';
import { StyleSheet, Text, Image, ImageBackground } from 'react-native'; // <-- UPDATED IMPORTS
import Onboarding from 'react-native-onboarding-swiper';

const OnboardingScreen = ({ navigation }) => {
  useEffect(() => {
    // Automatically navigate to the LoginScreen after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('LoginScreen');
    }, 2000);

    // Clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    // Replaced FastImage wrapper with ImageBackground for the background image
    <ImageBackground
      source={require('./assets/login.jpg')} // Your local background image
      style={styles.backgroundImage}
      resizeMode="cover" // Use cover to fill the screen
    >
      <Onboarding
        showSkip={false}
        showDone={false}
        pages={[
          {
            backgroundColor: 'transparent',
            // Replaced FastImage with the standard Image component
            image: <Image source={require('./assets/logo.gif')} style={styles.image} />,
            title: <Text style={styles.Text}>wezume</Text>,
            subtitle: 'Connect, create, and grow with video. Build your professional identity, one video at a time.',
          },
        ]}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 400,
    height: 400,
    resizeMode: 'contain',
  },
  Text: {
    color: 'white',
    fontSize: 40,
    fontWeight: '600',
    marginTop: -40,
  },
  // Ensure the container style works with ImageBackground
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default OnboardingScreen;