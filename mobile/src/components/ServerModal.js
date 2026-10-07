import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.js';
import { DEFAULT_API_URL } from '../services/config.js';
import { Ionicons } from '@expo/vector-icons';

export const ServerModal = ({ visible, onClose }) => {
  const { serverUrl, updateServerUrl } = useAuth();
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    let testEndpoint = inputUrl.trim();
    if (!testEndpoint.startsWith('http://') && !testEndpoint.startsWith('https://')) {
      testEndpoint = 'http://' + testEndpoint;
    }
    if (!testEndpoint.endsWith('/api')) {
      testEndpoint = testEndpoint.replace(/\/+$/, '') + '/api';
    }

    try {
      const res = await axios.get(`${testEndpoint}/health`, { timeout: 5000 });
      if (res.data?.status === 'ok') {
        setTestResult({ success: true, message: 'Server reached successfully!' });
      } else {
        setTestResult({ success: true, message: 'Server responded!' });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Cannot reach server. Verify your phone and PC are on the same Wi-Fi.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateServerUrl(inputUrl);
      Alert.alert('Saved', 'Server URL updated successfully.');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save server URL.');
    }
  };

  const handleReset = () => {
    setInputUrl(DEFAULT_API_URL);
    setTestResult(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="server-outline" size={20} color="#4f46e5" />
              <Text style={styles.title}>Backend Server Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Connect your phone to the backend API running on your PC or deployed in the cloud.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>API Base URL</Text>
            <TextInput
              style={styles.input}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="e.g. http://192.168.1.5:5000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {testResult && (
            <View
              style={[
                styles.resultBox,
                { backgroundColor: testResult.success ? '#ecfdf5' : '#fff1f2' },
              ]}
            >
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={testResult.success ? '#059669' : '#e11d48'}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: testResult.success ? '#047857' : '#be123c' },
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <>
                  <Ionicons name="pulse" size={16} color="#4f46e5" />
                  <Text style={styles.testBtnText}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset Default</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    flex: 1,
    gap: 6,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  resetBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

