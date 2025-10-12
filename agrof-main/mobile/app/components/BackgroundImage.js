import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const BackgroundImage = ({ children, overlayOpacity = 0.3, backgroundImage = 'welcome' }) => {
  console.log('🖼️ BackgroundImage component - backgroundImage prop:', backgroundImage);
  
  // Map background names to actual image sources
  const getBackgroundSource = (bgName) => {
    console.log('🖼️ Getting background source for:', bgName);
    try {
      let source;
      switch (bgName) {
        case 'welcome':
          console.log('🎯 Loading Welcome image...');
          source = require('../assets/welcome.png');
          console.log('🎯 Welcome image source:', source);
          break;
        case 'background1':
          source = require('../assets/background-image.png');
          break;
        case 'background2':
          source = require('../assets/background-image.png');
          break;
        case 'background3':
          source = require('../assets/landing.png');
          break;
        case 'fertilizers':
          source = require('../assets/fertilizers.png');
          break;
        case 'fungicides':
          source = require('../assets/fungicides.png');
          break;
        case 'herbicides':
          source = require('../assets/herbicides.png');
          break;
        case 'seeds':
          source = require('../assets/seeds.png');
          break;
        case 'nursery':
          source = require('../assets/nurserybed.png');
          break;
        case 'organic':
          source = require('../assets/organic_chemicals.png');
          break;
        case 'splash':
          source = require('../assets/splash.png');
          break;
        case 'landing':
          source = require('../assets/landing.png');
          break;
        case 'ai':
          console.log('🎯 Loading AI image...');
          source = require('../assets/care.png'); // Using care.png as AI background
          console.log('🎯 AI image source:', source);
          break;
        default:
          source = require('../assets/welcome.png');
      }
      console.log('🖼️ Background source resolved:', source);
      return source;
    } catch (error) {
      console.log('❌ Error loading background image:', bgName, error);
      return require('../assets/welcome.png');
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={getBackgroundSource(backgroundImage)} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => {
          console.log('❌ Image load error for', backgroundImage, ':', error.nativeEvent.error);
        }}
        onLoad={() => {
          console.log('✅ Background image loaded successfully:', backgroundImage);
        }}
      />
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}>
        {children}
      </View>
    </View>
  );
};

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
  },
  overlay: {
    flex: 1,
  },
});

export default BackgroundImage;
