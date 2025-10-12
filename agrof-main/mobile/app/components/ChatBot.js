
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import ChatbotWrapper from '../services/chatbotWrapper.js';

const ChatBot = ({ onShowTraining }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm AgrofBot. I can help with:\n\n• Crop diseases\n• Farming tips\n• Pest control\n• Weather advice\n• Market info\n\nWhat do you need?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState({});
  const scrollViewRef = useRef();

  // Enhanced agricultural knowledge database
  const knowledgeBase = {
    greetings: [
      "Hello! How can I help with your farming today?",
      "Hi there! What agricultural question do you have?",
      "Welcome! I'm here to help with your crops and farming needs.",
      "Greetings! Ready to help you grow better crops today!"
    ],
    diseases: {
      "maize rust": {
        symptoms: "Reddish-brown pustules on leaves, stems, and husks. Leaves may turn yellow and die prematurely.",
        treatment: "Apply fungicides containing azoxystrobin or pyraclostrobin. Remove infected plant debris. Plant resistant varieties like DK777 or SC719.",
        prevention: "Ensure proper spacing (75cm between rows), avoid overhead irrigation, rotate crops annually, and use certified seeds.",
        severity: "High - Can reduce yield by 30-50% if not controlled early"
      },
      "coffee leaf rust": {
        symptoms: "Yellow-orange spots on leaves that turn brown, premature leaf drop, reduced photosynthesis.",
        treatment: "Apply copper-based fungicides or systemic fungicides. Prune infected branches. Maintain good air circulation.",
        prevention: "Plant resistant varieties like Catimor, avoid dense planting, monitor regularly, and maintain proper shade.",
        severity: "Critical - Can destroy entire plantations if not managed"
      },
      "tomato blight": {
        symptoms: "Dark brown lesions on leaves, stems, and fruits. White fungal growth in humid conditions.",
        treatment: "Remove infected plants immediately. Apply copper fungicides or chlorothalonil. Improve air circulation.",
        prevention: "Water at soil level, avoid overhead irrigation, use resistant varieties, and maintain proper spacing.",
        severity: "High - Can spread rapidly in wet conditions"
      },
      "banana wilt": {
        symptoms: "Yellowing leaves, wilting, internal vascular discoloration, plant death.",
        treatment: "Remove and destroy infected plants. Apply systemic fungicides. Use clean planting material.",
        prevention: "Use disease-free suckers, avoid waterlogging, maintain good drainage, and rotate crops.",
        severity: "Critical - Can wipe out entire plantations"
      },
      "cassava mosaic": {
        symptoms: "Yellow mosaic patterns on leaves, stunted growth, reduced tuber yield.",
        treatment: "Remove infected plants. Use virus-free cuttings. Control whitefly vectors.",
        prevention: "Use certified disease-free cuttings, control whiteflies, and practice crop rotation.",
        severity: "Medium - Reduces yield but plants may survive"
      }
    },
    crops: {
      "maize": {
        planting: "Plant 2-3 seeds per hole, 5cm deep, 75cm between rows, 25cm within rows.",
        season: "Plant at onset of rains (March-April in Uganda).",
        fertilizer: "Apply NPK 17:17:17 at planting, top-dress with CAN at 6 weeks.",
        harvesting: "Harvest when kernels are hard and moisture is 20-25%."
      },
      "coffee": {
        planting: "Plant 2.5m x 2.5m spacing, 30cm deep holes.",
        season: "Plant at onset of long rains (March-May).",
        fertilizer: "Apply NPK 20:10:10 annually, organic matter every 2 years.",
        harvesting: "Harvest red ripe cherries, process within 24 hours."
      },
      "beans": {
        planting: "Plant 2-3 seeds per hole, 3cm deep, 50cm between rows.",
        season: "Plant in both short and long rains.",
        fertilizer: "Apply DAP at planting, top-dress with CAN.",
        harvesting: "Harvest when pods are dry and seeds rattle."
      }
    },
    general: {
      "fertilizer": "Use organic fertilizers like compost, manure, or NPK fertilizers based on soil test results. Apply during planting and growing seasons. Organic options improve soil health long-term.",
      "irrigation": "Water deeply but less frequently. Early morning watering reduces evaporation. Use drip irrigation for efficiency. Monitor soil moisture regularly.",
      "pest control": "Use integrated pest management: natural predators, crop rotation, resistant varieties, and minimal chemical use. Start with cultural practices.",
      "soil health": "Test soil pH annually, add organic matter, practice crop rotation, and avoid over-tilling. Healthy soil = healthy crops.",
      "weather": "Monitor weather forecasts regularly. Adjust planting times based on rainfall patterns. Protect crops during extreme weather events.",
      "market": "Research market prices before planting. Consider contract farming. Diversify crops to spread risk. Store properly to sell during off-season."
    }
  };

  const cleanResponse = (text) => {
    // Remove all emoji icons, symbols, and formatting
    return text
      .replace(/[🌱💊🌾🌿📚🌤️💰🏪🔍🛡️⚠️📅💩🌦️📤🤖🗑️]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/\*+/g, '') // Remove any remaining stars
      .replace(/^•/gm, '•') // Ensure proper bullet points
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .trim();
  };

  const organizeResponse = (title, items) => {
    if (!Array.isArray(items)) {
      return `${title}:\n\n${items}`;
    }
    
    const bulletPoints = items.map(item => `• ${item}`).join('\n');
    return `${title}:\n\n${bulletPoints}`;
  };

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return knowledgeBase.greetings[Math.floor(Math.random() * knowledgeBase.greetings.length)];
    }
    
    // Check for disease queries
    for (const [disease, info] of Object.entries(knowledgeBase.diseases)) {
      if (lowerMessage.includes(disease) || lowerMessage.includes(disease.replace(' ', ''))) {
        return `${disease.charAt(0).toUpperCase() + disease.slice(1)}:\n\n• ${info.symptoms.split('.')[0]}\n• ${info.treatment.split('.')[0]}\n• ${info.prevention.split('.')[0]}`;
      }
    }
    
    // Check for crop-specific queries
    for (const [crop, info] of Object.entries(knowledgeBase.crops)) {
      if (lowerMessage.includes(crop)) {
        return `${crop.charAt(0).toUpperCase() + crop.slice(1)}:\n\n• ${info.planting.split('.')[0]}\n• ${info.season}\n• ${info.fertilizer.split('.')[0]}`;
      }
    }
    
    // Check for general topics
    for (const [topic, info] of Object.entries(knowledgeBase.general)) {
      if (lowerMessage.includes(topic)) {
        return `${topic.charAt(0).toUpperCase() + topic.slice(1)}:\n\n${info}`;
      }
    }
    
    // Check for specific questions
    if (lowerMessage.includes('how to') || lowerMessage.includes('what is') || lowerMessage.includes('when to')) {
      if (lowerMessage.includes('plant')) {
        return "Planting:\n\n• Choose right season\n• Prepare soil\n• Plant at proper depth\n• Water after planting";
      }
      if (lowerMessage.includes('water') || lowerMessage.includes('irrigate')) {
        return "Watering:\n\n• Water deeply, less frequently\n• Water early morning\n• Check soil moisture\n• Use drip irrigation";
      }
      if (lowerMessage.includes('harvest')) {
        return "Harvesting:\n\n• Harvest at peak ripeness\n• Use clean tools\n• Handle gently\n• Store properly";
      }
      if (lowerMessage.includes('fertilize')) {
        return "Fertilization:\n\n• Test soil first\n• Use organic when possible\n• Apply at right stages\n• Don't over-fertilize";
      }
    }
    
    // Check for weather-related queries
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('drought')) {
      return "Weather & Farming:\n\n• Monitor forecasts\n• Adjust planting times\n• Use irrigation when needed\n• Protect from extreme weather";
    }
    
    // Check for market queries
    if (lowerMessage.includes('market') || lowerMessage.includes('price') || lowerMessage.includes('sell')) {
      return "Market & Sales:\n\n• Research prices first\n• Consider contract farming\n• Diversify crops\n• Store for off-season";
    }
    
    // Default responses for unknown queries
    const defaultResponses = [
      "I can help with crop diseases and farming. Try rephrasing your question.",
      "I know about crop diseases and farming. What else can I help with?",
      "I can help with plant diseases and farming. What do you need?",
      "I specialize in crop diseases and farming. Ask about those topics."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    try {
      console.log('Sending message to Gemini API...');
      console.log('ChatbotWrapper:', ChatbotWrapper);
      console.log('ChatbotWrapper type:', typeof ChatbotWrapper);
      console.log('ChatbotWrapper keys:', Object.keys(ChatbotWrapper || {}));
      
      // Use real Gemini chatbot API via wrapper
      const response = await ChatbotWrapper.sendMessage(inputText, userContext);
      
      if (response.success) {
        console.log('Gemini API response received');
        const botMessage = {
          id: Date.now() + 1,
          text: cleanResponse(response.message),
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.log('Gemini API failed, using fallback');
        // Fallback to local knowledge base
        const botResponse = generateBotResponse(inputText);
        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      // Fallback to local knowledge base
      const botResponse = generateBotResponse(inputText);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setMessages([{
              id: Date.now(),
              text: "Hello! I'm AgrofBot. I can help with:\n\n• Crop diseases\n• Farming tips\n• Pest control\n• Weather advice\n• Market info\n\nWhat do you need?",
              isBot: true,
              timestamp: new Date(),
            }]);
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/care.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content Overlay */}
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.isBot ? styles.botMessage : styles.userMessage
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.isBot ? styles.botBubble : styles.userBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.isBot ? styles.botText : styles.userText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.timestamp,
                message.isBot ? styles.botTimestamp : styles.userTimestamp
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Text style={styles.typingText}>AgrofBot is typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me about crops, diseases, farming..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={inputText.trim() === ''}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
        </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent overlay for better text readability
  },
  keyboardContainer: {
    flex: 1,
  },
  floatingButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    top: 50,
  },
  trainingButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 25,
    padding: 12,
    marginLeft: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  trainingButtonText: {
    fontSize: 20,
    color: 'white',
  },
  clearButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 25,
    padding: 12,
    marginLeft: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  clearButtonText: {
    fontSize: 20,
    color: 'white',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  botTimestamp: {
    color: '#666',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 45,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChatBot;

