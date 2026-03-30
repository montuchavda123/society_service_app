import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import socketService from '../../services/socketService';

const screenWidth = Dimensions.get('window').width;

export default function MechanicDashboardScreen() {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(Config.ENDPOINTS.COMPLAINTS, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket listener for real-time assignment
    socketService.connect(user?._id);
    const socket = socketService.getSocket();
    
    socket?.on('complaint_assigned', fetchData);
    socket?.on('complaint_status_update', fetchData);

    return () => {
      // socketService.disconnect(); // Keep alive for navigation
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const stats = {
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    inProgress: complaints.filter(c => c.status === 'Accepted' || c.status === 'In Progress').length,
    completed: complaints.filter(c => c.status === 'Completed' || c.status === 'Closed').length,
  };

  const currentJob = complaints.find(c => c.status === 'In Progress') || complaints.find(c => c.status === 'Accepted');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Workday 🛠️</Text>
          <Text style={styles.societyName}>{user?.name} | {user?.role}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* KPI Row */}
        <View style={styles.statsRow}>
           <View style={[styles.statCard, { backgroundColor: '#3b82f615' }]}>
             <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.assigned}</Text>
             <Text style={styles.statLabel}>New</Text>
           </View>
           <View style={[styles.statCard, { backgroundColor: '#f59e0b15' }]}>
             <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.inProgress}</Text>
             <Text style={styles.statLabel}>Active</Text>
           </View>
           <View style={[styles.statCard, { backgroundColor: '#10b98115' }]}>
             <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
             <Text style={styles.statLabel}>Solved</Text>
           </View>
        </View>

        {/* Current Focus */}
        <Text style={styles.sectionTitle}>Current Focus</Text>
        {currentJob ? (
          <TouchableOpacity 
             style={styles.focusCard} 
             onPress={() => router.push('/mechanic-jobs')}
          >
            <View style={styles.focusHeader}>
               <View style={styles.focusTag}>
                  <Text style={styles.focusTagText}>{currentJob.status}</Text>
               </View>
               <Text style={styles.priorityText}>{currentJob.priority} Priority</Text>
            </View>
            <Text style={styles.focusTitle}>{currentJob.title}</Text>
            <View style={styles.locationRow}>
               <MaterialIcons name="location-on" size={16} color="#3b82f6" />
               <Text style={styles.locationText}>Resident: {currentJob.userId?.name} ({currentJob.userId?.flatNumber || 'N/A'})</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyFocus}>
             <MaterialIcons name="event-available" size={32} color="#334155" />
             <Text style={styles.emptyFocusText}>No active job. Check new assignments!</Text>
          </View>
        )}

        {/* Quick List */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Upcoming Queue</Text>
           <TouchableOpacity onPress={() => router.push('/mechanic-jobs')}>
              <Text style={styles.seeAll}>Manage Jobs</Text>
           </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : complaints.filter(c => c.status === 'Assigned').length === 0 ? (
          <Text style={styles.emptyText}>Empty queue</Text>
        ) : (
          <View style={styles.recentList}>
            {complaints.filter(c => c.status === 'Assigned').slice(0, 3).map((item) => (
              <TouchableOpacity key={item._id} style={styles.recentItem} onPress={() => router.push('/mechanic-jobs')}>
                <View style={[styles.priorityDot, { backgroundColor: item.priority === 'Urgent' ? '#ef4444' : '#3b82f6' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recentLoc}>{item.userId?.flatNumber || 'No Location'}</Text>
                </View>
                <Entypo name="chevron-right" size={20} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  societyName: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  focusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3b82f655',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  focusTag: {
    backgroundColor: '#3b82f633',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  focusTagText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  priorityText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  focusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyFocus: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyFocusText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  recentList: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  recentTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  recentLoc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  }
});
