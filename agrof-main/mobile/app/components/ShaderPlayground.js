import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function FuturisticTechShowcase() {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Simple animation values
  const agrofFallAnim = useRef(new Animated.Value(-200)).current; // Start closer for normal fall
  const agrofOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible
  // Leaf animation removed - only AGRON word will fall

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // AGRON falls to center with normal fall effect
    Animated.parallel([
      Animated.timing(agrofFallAnim, {
        toValue: 0,
        duration: 2000, // Normal fall speed
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(agrofOpacityAnim, {
        toValue: 1,
        duration: 1500, // Fade in faster
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      })
    ]).start(() => {
      // AGRON animation complete - no leaf animation
    });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/background-image.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onLoad={() => setImageLoaded(true)}
        fadeDuration={0}
        loading="eager"
      />
      <View style={styles.content}>
        {/* AGRON falling to center */}
        <Animated.View style={[
          styles.agrofContainer,
          {
            transform: [
              { translateY: agrofFallAnim }
            ],
            opacity: agrofOpacityAnim
          }
        ]}>
          <Text style={styles.agrofTitle}>AGRON</Text>
          <View style={styles.agrofGlow} />
        </Animated.View>

        {/* Leaf animation removed - only AGRON word falls */}

        {/* Welcome message at the top */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>AGRON</Text>
          <Text style={styles.welcomeSubtitle}>Your AI Powered Crop Health Companion</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2,
  },
  agrofContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 100,
    zIndex: 10,
  },
  agrofTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    textShadowColor: '#4CAF50',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    zIndex: 2,
  },
  agrofGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 50,
    zIndex: 1,
  },
  // Leaf styles removed
  welcomeSection: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5530',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },

});
