import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import socketService from '../../services/socketService';

const screenWidth = Dimensions.get('window').width;

export default function MemberDashboardScreen() {
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
    socketService.connect(user?._id);
    const socket = socketService.getSocket();
    
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

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => ['Pending', 'Assigned', 'Accepted', 'In Progress'].includes(c.status)).length,
    completed: complaints.filter(c => ['Completed', 'Closed'].includes(c.status)).length,
  };

  const renderRecentItem = (item: any) => (
    <TouchableOpacity 
      key={item._id}
      style={styles.recentItem} 
      onPress={() => router.push('/member-history')}
    >
      <View style={[styles.statusLine, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recentMeta}>{item.status} • {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Entypo name="chevron-small-right" size={24} color="#64748b" />
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'Assigned': 
      case 'Accepted':
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hi, {user?.name} 👋</Text>
          <Text style={styles.societyName}>Resident Dashboard</Text>
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
           <View style={styles.statCard}>
             <Text style={[styles.statValue, { color: '#f8fafc' }]}>{stats.total}</Text>
             <Text style={styles.statLabel}>Total</Text>
           </View>
           <View style={styles.statCard}>
             <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.active}</Text>
             <Text style={styles.statLabel}>Active</Text>
           </View>
           <View style={styles.statCard}>
             <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.completed}</Text>
             <Text style={styles.statLabel}>Solved</Text>
           </View>
        </View>

        {/* Hero Action */}
        <TouchableOpacity 
          style={styles.heroAction} 
          onPress={() => router.push('/member-complaints')}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
               <FontAwesome5 name="plus" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Raise New Complaint</Text>
              <Text style={styles.heroSubtitle}>Report via Voice or Text AI</Text>
            </View>
          </View>
          <Entypo name="chevron-right" size={24} color="#3b82f6" />
        </TouchableOpacity>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No complaints raised yet</Text>
             <Text style={styles.emptySub}>Report an issue and we'll help you solve it!</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {complaints.slice(0, 5).map(renderRecentItem)}
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroAction: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3b82f644',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  recentList: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
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
  statusLine: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 16,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  recentMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  }
});
