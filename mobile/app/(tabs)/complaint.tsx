import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

export default function ComplaintScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Others');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  async function startRecording() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      processVoice(uri);
    }
  }

  async function processVoice(uri: string) {
    setProcessingAI(true);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      });

      const response = await fetch(Config.ENDPOINTS.PROCESS_VOICE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setTitle(data.structuredData.title);
        setDescription(data.structuredData.description);
        setCategory(data.structuredData.category);
        Alert.alert('AI Processed', 'Your voice complaint has been structured automatically.');
      } else {
        Alert.alert('AI Error', data.message || 'Failed to process voice');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to AI service');
    } finally {
      setProcessingAI(false);
    }
  }

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(Config.ENDPOINTS.COMPLAINTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ title, description, category }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Complaint raised successfully!');
        router.replace('/(tabs)');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to submit complaint');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>New Complaint</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.voiceSection}>
          <Text style={styles.voiceLabel}>Prefer speaking?</Text>
          <Text style={styles.voiceSub}>Tap the mic and tell us about the problem.</Text>
          
          <TouchableOpacity 
            style={[styles.micBtn, isRecording && styles.micBtnActive]} 
            onPress={isRecording ? stopRecording : startRecording}
            disabled={processingAI}
          >
            {processingAI ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FontAwesome5 name={isRecording ? "stop" : "microphone"} size={32} color="#fff" />
            )}
          </TouchableOpacity>
          {isRecording && <Text style={styles.recordingText}>Listening...</Text>}
          {processingAI && <Text style={styles.processingText}>AI is structuring your complaint...</Text>}
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR FILL DETAILS</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Water leakage in kitchen" 
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Describe the issue in detail..." 
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {['Plumbing', 'Electrical', 'Appliance', 'Others'].map((cat) => (
              <TouchableOpacity 
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={submitting || processingAI}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voiceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  voiceSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 20,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  recordingText: {
    color: '#ef4444',
    marginTop: 12,
    fontWeight: '600',
  },
  processingText: {
    color: '#3b82f6',
    marginTop: 12,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  catBtnActive: {
    backgroundColor: '#3b82f633',
    borderColor: '#3b82f6',
  },
  catText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#3b82f6',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
