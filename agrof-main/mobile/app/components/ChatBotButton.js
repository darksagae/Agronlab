import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';

const ChatBotButton = ({ onPress, style, size = 60 }) => {
  return (
    <TouchableOpacity 
      style={[styles.chatbotButton, { width: size, height: size }, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.chatbotIconContainer, {
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#4CAF50',
      }]}>
        <Image 
          source={require('../assets/bot.png')} 
          style={[styles.botImage, { width: size, height: size }]}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatbotButton: {
    position: 'absolute',
    bottom: 150, // Moved up further from 120 to 150 for better positioning
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  chatbotIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  botImage: {
    // Image styles are handled inline with dynamic sizing
  },
});

export default ChatBotButton;
