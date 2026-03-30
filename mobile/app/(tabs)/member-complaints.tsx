import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router } from 'expo-router';

const CATEGORIES = ['Plumbing', 'Electrical', 'Appliance', 'Security', 'Cleaning', 'Others'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function RaiseComplaintScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
  });

  // Recording State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission denied', 'Microphone access is required for voice complaints.');
        return;
      }

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
    if (!recording) return;
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI found');

      // Send to AI Backend
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await fetch(`${Config.BASE_URL}/ai/process-voice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.structuredData) {
        const { title, description, category, priority } = data.structuredData;
        setFormData({
          title: title || '',
          description: description || '',
          category: CATEGORIES.includes(category) ? category : 'Others',
          priority: PRIORITIES.includes(priority) ? priority : 'Medium',
        });
        Alert.alert('AI Processed', 'Form has been auto-filled. Please review and submit.');
      } else {
        Alert.alert('AI Error', 'Failed to process voice. Please fill manually.');
      }
    } catch (err) {
      Alert.alert('Error', 'Transcription failed');
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  }

  const handleSubmit = async () => {
    const { title, description, category, priority } = formData;
    if (!title || !description || !category || !priority) {
      Alert.alert('Required', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(Config.ENDPOINTS.COMPLAINTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Complaint registered successfully!');
        router.replace('/member-history');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Raise Complaint</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* VOICE SECTION */}
        <View style={styles.voiceSection}>
           <Text style={styles.voiceLabel}>Magic Voice Input 🎤</Text>
           <Text style={styles.voiceSub}>Speak naturally, our AI will fill the form for you!</Text>
           
           <TouchableOpacity 
             style={[styles.micBtn, isRecording && styles.micBtnActive]} 
             onPressIn={startRecording}
             onPressOut={stopRecording}
             activeOpacity={0.7}
           >
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialIcons name={isRecording ? "stop" : "mic"} size={40} color="#fff" />
              )}
           </TouchableOpacity>
           <Text style={styles.micHint}>
             {isProcessing ? 'AI Processing...' : isRecording ? 'Recording... Release to process' : 'Hold to Speak'}
           </Text>
        </View>

        <View style={styles.divider} />

        {/* MANUAL FORM */}
        <View style={styles.form}>
           <Text style={styles.label}>Complaint Title</Text>
           <TextInput
             style={styles.input}
             value={formData.title}
             onChangeText={(val) => setFormData({...formData, title: val})}
             placeholder="e.g. Water leakage in bathroom"
             placeholderTextColor="#64748b"
           />

           <Text style={styles.label}>Detailed Description</Text>
           <TextInput
             style={[styles.input, styles.textArea]}
             value={formData.description}
             onChangeText={(val) => setFormData({...formData, description: val})}
             placeholder="Describe the issue in detail..."
             placeholderTextColor="#64748b"
             multiline
             numberOfLines={4}
           />

           <Text style={styles.label}>Category</Text>
           <View style={styles.pickerRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                   key={cat} 
                   style={[styles.pickerItem, formData.category === cat && styles.pickerItemActive]}
                   onPress={() => setFormData({...formData, category: cat})}
                >
                  <Text style={[styles.pickerText, formData.category === cat && styles.pickerTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
           </View>

           <Text style={styles.label}>Urgency Level</Text>
           <View style={styles.pickerRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity 
                   key={p} 
                   style={[styles.priorityItem, formData.priority === p && (styles as any)[`priority${p}`]]}
                   onPress={() => setFormData({...formData, priority: p})}
                >
                  <Text style={[styles.priorityText, formData.priority === p && styles.priorityTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
           </View>

           <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading || isProcessing}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  voiceSection: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f644',
    marginBottom: 24,
  },
  voiceLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  voiceSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
  },
  micHint: {
    marginTop: 16,
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: -8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerItemActive: {
    backgroundColor: '#3b82f633',
    borderColor: '#3b82f6',
  },
  pickerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  pickerTextActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  priorityItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  priorityUrgent: { backgroundColor: '#ef4444' },
  priorityHigh: { backgroundColor: '#f97316' },
  priorityMedium: { backgroundColor: '#3b82f6' },
  priorityLow: { backgroundColor: '#64748b' },
  priorityText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  priorityTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  }
});
