import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Text, View, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Config from '../constants/Config';
import { router } from 'expo-router';

const roles = [
  { label: 'Resident', value: 'Member' },
  { label: 'Secretary', value: 'Secretary' },
  { label: 'Mechanic', value: 'Mechanic' }
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Member' | 'Secretary' | 'Mechanic'>('Member');
  const [societyCode, setSocietyCode] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!name) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Email address is required');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    if (!phone) {
      Alert.alert('Error', 'Phone Number is required');
      return;
    }
    if (role !== 'Secretary' && !societyCode) {
      Alert.alert('Error', 'Society Code is required');
      return;
    }
    if (role === 'Secretary' && !companyName) {
      Alert.alert('Error', 'Company / Society Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(Config.ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, societyCode, phone, companyName }),
      });

      const data = await response.json();
      if (response.ok) {
        if (Platform.OS === 'web') {
          alert(`Registration Successful! ${data.message || 'You can now log in with your credentials.'}`);
          router.replace('/login');
        } else {
          Alert.alert(
            'Registration Successful',
            data.message || 'You can now log in with your credentials.',
            [{ text: 'OK', onPress: () => router.replace('/login') }]
          );
        }
      } else {
        Alert.alert('Registration Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Us</Text>
          <Text style={styles.subtitle}>Create an account to get started</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Register as:</Text>
          <View style={styles.roleContainer}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleButton, role === r.value && styles.activeRole]}
                onPress={() => setRole(r.value as any)}
              >
                <Text style={[styles.roleText, role === r.value && styles.activeRoleText]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === 'Secretary' ? (
            <TextInput 
              style={styles.input} 
              placeholder="Company / Society Name" 
              placeholderTextColor="#999" 
              value={companyName} 
              onChangeText={setCompanyName} 
            />
          ) : (
            <TextInput 
              style={styles.input} 
              placeholder="Society Code" 
              placeholderTextColor="#999" 
              value={societyCode} 
              onChangeText={setSocietyCode} 
              autoCapitalize="characters" 
            />
          )}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
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
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    gap: 16,
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
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  activeRole: {
    backgroundColor: '#3b82f633',
    borderColor: '#3b82f6',
  },
  roleText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeRoleText: {
    color: '#3b82f6',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  linkHighlight: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
