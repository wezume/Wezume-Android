import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
// Removed: import UserIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// --- ICONS ---
// We render icons directly now.

const MenuComponent = ({
  isVisible,
  onClose,
  menuItems,
  userName,
  jobOption,
  profileImage,
}) => {
  const menuWidth = width * 0.8;
  const slideAnim = useRef(new Animated.Value(menuWidth)).current;
  const route = useRoute();
  const [isMenuRendered, setIsMenuRendered] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setIsMenuRendered(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: menuWidth,
        useNativeDriver: true,
      }).start(() => setIsMenuRendered(false));
    }
  }, [isVisible, slideAnim, menuWidth]);

  const mainMenuItems = menuItems.filter(item => item.label !== 'Logout');
  const logoutItem = menuItems.find(item => item.label === 'Logout');

  if (!isMenuRendered) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.backdrop, {
            opacity: slideAnim.interpolate({
              inputRange: [0, menuWidth],
              outputRange: [0.5, 0],
            })
          }]}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }], width: menuWidth, right: 0 },
        ]}
      >
        <LinearGradient
          colors={['#0093E9', '#80D0C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileSection}
        >
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              // --- REPLACED Icon with Vector Icon ---
              <MaterialIcons name="person" size={40} color="#fff" />
              // ------------------------------------
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userNameText}>{userName || 'Guest'}</Text>
            {jobOption && <Text style={styles.jobOptionText}>{jobOption}</Text>}
          </View>
        </LinearGradient>

        <FlatList
          data={mainMenuItems}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.menuItem, route.name === item.routeName && styles.activeMenuItem]}
              onPress={() => {
                item.onPress();
                onClose();
              }}
            >
              {/* Note: item.icon is expected to be a Text component with an emoji, passed from the parent Header */}
              {item.icon && React.cloneElement(item.icon, {
                // Pass a color prop only if the icon component is set up to receive it.
                // Since the menu items are set up with a style on the Text component itself in the Header, 
                // cloning with a new style is more robust than a 'color' prop here.
              })}
              <Text style={[styles.menuText, route.name === item.routeName && styles.activeMenuText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.menuContent}
        />

        {logoutItem && (
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                logoutItem.onPress();
                onClose();
              }}
            >
              {logoutItem.icon}
              <Text style={styles.menuText}>{logoutItem.label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  menuContainer: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
  },
  profileSection: {
    paddingVertical: 20,
    paddingTop: 70,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,

  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },

  profileImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    marginLeft: 15,
  },
  userNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  jobOptionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuContent: {
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  activeMenuText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  menuText: {
    fontSize: 18,
    color: '#4F4F4F',
    marginLeft: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 65,
  },
  logoutSection: {
    marginTop: 'auto',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9e9e9',
    paddingBottom: 40,
  },
});

export default React.memo(MenuComponent);