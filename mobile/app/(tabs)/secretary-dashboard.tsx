import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import socketService from '../../services/socketService';

const screenWidth = Dimensions.get('window').width;

export default function SecretaryDashboardScreen() {
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

    // Socket listener for status updates
    socketService.connect(user?._id, user?.societyId);
    const socket = socketService.getSocket();

    socket?.on('complaint_created', fetchData);
    socket?.on('complaint_status_update', fetchData);
    socket?.on('complaint_assigned', fetchData);

    return () => {
      // socketService.disconnect();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const assigned = complaints.filter(c => c.status === 'Assigned' || c.status === 'Accepted' || c.status === 'In Progress').length;
    const completed = complaints.filter(c => c.status === 'Completed' || c.status === 'Closed').length;
    return { total, pending, assigned, completed };
  };

  const stats = getStats();

  const renderComplaintItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.recentItem} 
      onPress={() => router.push('/manage-complaints')}
    >
      <View style={styles.recentIcon}>
        <Entypo name="dot-single" size={24} color={item.priority === 'Urgent' ? '#ef4444' : '#3b82f6'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recentStatus}>{item.status} • {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Entypo name="chevron-small-right" size={24} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Secretary Panel</Text>
          <Text style={styles.societyName}>{user?.societyCode && `Code: ${user.societyCode}`}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* KPI Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#3b82f615' }]}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b15' }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8b5cf615' }]}>
            <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b98115' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/manage-complaints')}>
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="assignment" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Assign Job</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/manage-members')}>
            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
              <MaterialIcons name="person-add" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Add Member</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Complaints */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Received</Text>
          <TouchableOpacity onPress={() => router.push('/manage-complaints')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : complaints.length === 0 ? (
          <Text style={styles.emptyText}>No recent complaints</Text>
        ) : (
          <View style={styles.recentList}>
            {complaints.slice(0, 5).map((item) => (
              <View key={item._id}>{renderComplaintItem({ item })}</View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: (screenWidth - 60) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  recentIcon: {
    marginRight: 4,
  },
  recentTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  recentStatus: {
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
