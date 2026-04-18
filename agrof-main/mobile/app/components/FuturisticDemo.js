import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FuturisticAIAnalysisScreen from './FuturisticAIAnalysisScreen';

const { width, height } = Dimensions.get('window');

const FuturisticDemo = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoData, setDemoData] = useState({
    crop_detection: {
      identified_crop: 'maize',
      confidence: 0.94,
      detection_method: 'Quantum AI Analysis',
      pattern_matching_score: 0.96
    },
    disease_detection: {
      disease: 'common_rust',
      severity: 'moderate',
      confidence: 0.91,
      immediate_treatments: [
        'Apply copper-based fungicide within 24 hours',
        'Remove infected plant debris immediately',
        'Improve field ventilation and spacing'
      ]
    }
  });

  const startDemo = () => {
    setShowDemo(true);
  };

  const stopDemo = () => {
    setShowDemo(false);
  };

  if (showDemo) {
    return (
      <FuturisticAIAnalysisScreen
        isVisible={true}
        onComplete={stopDemo}
        analysisData={demoData}
        imageUri="demo_image"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Futuristic Background */}
      <View style={styles.backgroundGlow} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 FUTURISTIC AI DEMO</Text>
        <Text style={styles.headerSubtitle}>Experience the Next Generation of Plant Analysis</Text>
      </View>

      {/* Demo Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>What You'll Experience:</Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <MaterialIcons name="auto-awesome" size={24} color="#00FFFF" />
            <Text style={styles.featureText}>Glowing Holographic AI Avatars</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="memory" size={24} color="#FF00FF" />
            <Text style={styles.featureText}>Quantum Computing Visualizations</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="psychology" size={24} color="#FF6B35" />
            <Text style={styles.featureText}>Real-time AI Analysis Steps</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="scanner" size={24} color="#4ECDC4" />
            <Text style={styles.featureText}>Sci-Fi Style Progress Matrix</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="bug-report" size={24} color="#FFD93D" />
            <Text style={styles.featureText}>Advanced Disease Detection</Text>
          </View>
        </View>
      </View>

      {/* Demo Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>AI System Capabilities:</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>99.9%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2.3s</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Disease Types</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>∞</Text>
            <Text style={styles.statLabel}>Learning Capacity</Text>
          </View>
        </View>
      </View>

      {/* Start Demo Button */}
      <TouchableOpacity style={styles.startButton} onPress={startDemo}>
        <View style={styles.buttonGlow} />
        <Text style={styles.startButtonText}>🚀 LAUNCH QUANTUM AI DEMO</Text>
        <Text style={styles.startButtonSubtext}>Experience the Future of Plant Analysis</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by Advanced Neural Networks & Quantum Computing
        </Text>
        <Text style={styles.footerSubtext}>
          AGRON AI System v2.0 - The Future is Now
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    textAlign: 'center',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FF00FF',
    textAlign: 'center',
    lineHeight: 22,
  },
  descriptionContainer: {
    marginBottom: 40,
    width: '100%',
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD93D',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 15,
    flex: 1,
  },
  statsContainer: {
    marginBottom: 40,
    width: '100%',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statCard: {
    width: '45%',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00FFFF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 40,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  startButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#FF00FF',
    textAlign: 'center',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#4ECDC4',
    textAlign: 'center',
  },
});

export default FuturisticDemo;
