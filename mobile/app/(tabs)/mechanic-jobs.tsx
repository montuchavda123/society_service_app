import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import socketService from '../../services/socketService';

type JobStatus = 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Closed';

export default function MechanicJobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await fetch(Config.ENDPOINTS.COMPLAINTS, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setJobs(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Socket listener for assignments
    socketService.connect(user?._id);
    const socket = socketService.getSocket();
    
    socket?.on('complaint_assigned', fetchJobs);
    socket?.on('complaint_status_update', fetchJobs);

    return () => {
      // socketService.disconnect();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: JobStatus) => {
    try {
      const response = await fetch(`${Config.ENDPOINTS.COMPLAINTS}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchJobs();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.priorityBadge, (styles as any)[`priority${item.priority}`]]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
        <Text style={styles.statusLabel}>{item.status}</Text>
      </View>

      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobDesc}>{item.description}</Text>

      <View style={styles.locationContainer}>
         <View style={styles.locationItem}>
            <MaterialIcons name="person" size={14} color="#3b82f6" />
            <Text style={styles.locationText}>{item.userId?.name || 'Resident'}</Text>
         </View>
         <View style={styles.locationItem}>
            <MaterialIcons name="door-front" size={14} color="#10b981" />
            <Text style={styles.locationText}>Flat: {item.userId?.flatNumber || 'N/A'}</Text>
         </View>
      </View>

      <View style={styles.actionRow}>
        {item.status === 'Assigned' && (
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleUpdateStatus(item._id, 'Accepted')}>
            <Text style={styles.btnText}>Accept Job</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Accepted' && (
          <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={() => handleUpdateStatus(item._id, 'In Progress')}>
            <Text style={styles.btnText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {item.status === 'In Progress' && (
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleUpdateStatus(item._id, 'Completed')}>
            <Text style={styles.btnText}>Mark Finished</Text>
          </TouchableOpacity>
        )}
        {(item.status === 'Completed' || item.status === 'Closed') && (
           <View style={styles.doneTag}>
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
              <Text style={styles.doneText}>Task Resolved</Text>
           </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Assignments</Text>
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome5 name="clipboard-check" size={64} color="#334155" />
              <Text style={styles.emptyText}>Zero tasks today! Enjoy your break.</Text>
            </View>
          }
        />
      )}
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
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityUrgent: { backgroundColor: '#ef4444' },
  priorityHigh: { backgroundColor: '#f97316' },
  priorityMedium: { backgroundColor: '#3b82f6' },
  priorityLow: { backgroundColor: '#64748b' },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  jobDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  acceptBtn: { backgroundColor: '#3b82f6' },
  startBtn: { backgroundColor: '#f97316' },
  completeBtn: { backgroundColor: '#10b981' },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  doneTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b98115',
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 20,
  }
});
