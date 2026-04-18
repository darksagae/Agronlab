import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  findWorkingApiEndpoint, 
  getCurrentApiConfig, 
  API_CONFIG 
} from '../config/apiConfig';

const NetworkDiagnostics = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState({
    testing: false,
    results: [],
    workingEndpoint: null,
    currentConfig: null
  });

  const runDiagnostics = async () => {
    setDiagnostics(prev => ({ ...prev, testing: true, results: [] }));
    
    const results = [];
    const endpoints = [
      { name: 'Primary IP (WiFi)', url: 'http://192.168.1.15:3001' },
      { name: 'WiFi IP', url: 'http://192.168.1.15:3001' },
      { name: 'Localhost', url: 'http://127.0.0.1:3001' },
      { name: 'Android Emulator Host', url: 'http://10.0.2.2:3001' },
      { name: 'Local Host', url: 'http://localhost:3001' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Testing ${endpoint.name}: ${endpoint.url}`);
        
        const response = await fetch(`${endpoint.url}/api/health`, {
          method: 'GET',
          timeout: 3000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            ...endpoint,
            status: 'success',
            message: `✅ Connected (${response.status})`,
            details: data
          });
        } else {
          results.push({
            ...endpoint,
            status: 'error',
            message: `❌ HTTP Error ${response.status}`,
            details: null
          });
        }
      } catch (error) {
        results.push({
          ...endpoint,
          status: 'error',
          message: `❌ ${error.message}`,
          details: null
        });
      }
    }

    // Try dynamic endpoint discovery
    try {
      const workingIp = await findWorkingApiEndpoint();
      const config = getCurrentApiConfig();
      
      setDiagnostics({
        testing: false,
        results,
        workingEndpoint: workingIp,
        currentConfig: config
      });
    } catch (error) {
      setDiagnostics({
        testing: false,
        results,
        workingEndpoint: null,
        currentConfig: null
      });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyDiagnostics = () => {
    const diagnosticText = [
      'AGRON Network Diagnostics Report',
      '=====================================',
      `Timestamp: ${new Date().toISOString()}`,
      '',
      'Endpoint Tests:',
      ...diagnostics.results.map(result => 
        `${result.name}: ${result.message}`
      ),
      '',
      `Working Endpoint: ${diagnostics.workingEndpoint || 'None found'}`,
      '',
      'Current Configuration:',
      diagnostics.currentConfig ? 
        JSON.stringify(diagnostics.currentConfig, null, 2) : 
        'No configuration available'
    ].join('\n');

    // In a real app, you might use Clipboard.setString(diagnosticText)
    Alert.alert('Diagnostics', 'Diagnostic information logged to console', [
      { text: 'OK' }
    ]);
    console.log(diagnosticText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Diagnostics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {diagnostics.testing ? (
          <View style={styles.testing}>
            <MaterialIcons name="wifi-tethering" size={48} color="#4CAF50" />
            <Text style={styles.testingText}>Testing network connections...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endpoint Tests</Text>
              {diagnostics.results.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.endpointName}>{result.name}</Text>
                  <Text style={styles.endpointUrl}>{result.url}</Text>
                  <Text style={[
                    styles.resultMessage,
                    result.status === 'success' ? styles.success : styles.error
                  ]}>
                    {result.message}
                  </Text>
                </View>
              ))}
            </View>

            {diagnostics.workingEndpoint && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Configuration</Text>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Working IP:</Text>
                  <Text style={styles.configValue}>{diagnostics.workingEndpoint}</Text>
                </View>
                {diagnostics.currentConfig && (
                  <>
                    <View style={styles.configItem}>
                      <Text style={styles.configLabel}>Store API:</Text>
                      <Text style={styles.configValue}>{diagnostics.currentConfig.storeUrl}</Text>
                    </View>
                    <View style={styles.configItem}>
                      <Text style={styles.configLabel}>AI API:</Text>
                      <Text style={styles.configValue}>{diagnostics.currentConfig.aiUrl}</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity onPress={runDiagnostics} style={styles.button}>
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.buttonText}>Run Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={copyDiagnostics} style={styles.button}>
                <MaterialIcons name="content-copy" size={20} color="#fff" />
                <Text style={styles.buttonText}>Copy Report</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.help}>
              <Text style={styles.helpTitle}>Troubleshooting Tips:</Text>
              <Text style={styles.helpText}>
                • Make sure both backend servers are running{'\n'}
                • Check that your device is on the same network{'\n'}
                • Try restarting the app if no endpoints work{'\n'}
                • The app will work offline with cached data
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2d2d2d',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testing: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 60,
  },
  testingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  endpointName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endpointUrl: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  resultMessage: {
    fontSize: 14,
    marginTop: 8,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#f44336',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  configLabel: {
    color: '#999',
    fontSize: 14,
  },
  configValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  help: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
  },
  helpTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NetworkDiagnostics;
