import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

export default function RootIndex() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Redirect based on role to their specialized dashboard
        switch (user.role) {
          case 'SuperAdmin':
            router.replace('/admin-dashboard');
            break;
          case 'Secretary':
            router.replace('/secretary-dashboard');
            break;
          case 'Member':
            router.replace('/member-dashboard');
            break;
          case 'Mechanic':
            router.replace('/mechanic-dashboard');
            break;
          default:
            // Fallback (should not happen with strict roles)
            router.replace('/login');
        }
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Initializing Society Service...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
});
