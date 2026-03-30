import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import socketService from '../../services/socketService';

type StatusType = 'Pending' | 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Closed';

export default function ManageComplaintsScreen() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusType | 'All'>('All');
  
  // Assignment Modal
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [compRes, mechRes] = await Promise.all([
        fetch(Config.ENDPOINTS.COMPLAINTS, { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch(`${Config.BASE_URL}/society/members`, { headers: { Authorization: `Bearer ${user?.token}` } })
      ]);
      
      const compData = await compRes.json();
      const mechData = await mechRes.json();
      
      if (compRes.ok) setComplaints(compData);
      if (mechRes.ok) setMechanics(mechData.filter((m: any) => m.role === 'Mechanic'));
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Real-time listener
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

  const handleAssign = async (complaintId: string, mechanicId: string) => {
    try {
      const response = await fetch(`${Config.ENDPOINTS.COMPLAINTS}/${complaintId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ mechanicId }),
      });
      if (response.ok) {
        setAssigningId(null);
        fetchData();
        Alert.alert('Success', 'Mechanic assigned successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Assignment failed');
    }
  };

  const filteredComplaints = activeFilter === 'All' 
    ? complaints 
    : complaints.filter(c => c.status === activeFilter || (activeFilter === 'Assigned' && (c.status === 'Accepted' || c.status === 'In Progress')));

  const renderComplaintItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
           <View style={[styles.priorityBadge, (styles as any)[`priority${item.priority}`]]}>
             <Text style={styles.priorityText}>{item.priority}</Text>
           </View>
           <View style={[styles.statusBadge, (styles as any)[`status${item.status.replace(' ', '')}`]]}>
             <Text style={styles.statusText}>{item.status}</Text>
           </View>
        </View>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.complaintTitle}>{item.title}</Text>
      <Text style={styles.complaintDesc}>{item.description}</Text>
      
      <View style={styles.userRow}>
        <MaterialIcons name="person-outline" size={14} color="#94a3b8" />
        <Text style={styles.userName}>{item.userId?.name} {item.userId?.flatNumber ? `(${item.userId.flatNumber})` : ''}</Text>
      </View>

      {item.mechanicId && (
        <View style={[styles.userRow, { marginTop: 4 }]}>
          <FontAwesome5 name="wrench" size={12} color="#8b5cf6" />
          <Text style={[styles.userName, { color: '#8b5cf6' }]}>Mechanic: {item.mechanicId.name || 'Assigned'}</Text>
        </View>
      )}

      {item.status === 'Pending' && (
        <TouchableOpacity style={styles.assignBtn} onPress={() => setAssigningId(item._id)}>
          <Text style={styles.assignBtnText}>Assign Mechanic</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Complaint Management</Text>
      
      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {['All', 'Pending', 'Assigned', 'Completed', 'Closed'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter as any)}
              style={[styles.tab, activeFilter === filter && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeFilter === filter && styles.tabTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredComplaints}
          renderItem={renderComplaintItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="documents-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>No complaints in this category</Text>
            </View>
          }
        />
      )}

      {/* MECHANIC SELECTION MODAL */}
      <Modal visible={!!assigningId} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAssigningId(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Mechanic</Text>
            {mechanics.length === 0 ? (
               <Text style={styles.noMechText}>No mechanics available in your society.</Text>
            ) : (
              mechanics.map((mech) => (
                <TouchableOpacity 
                  key={mech._id} 
                  style={styles.mechItem} 
                  onPress={() => handleAssign(assigningId!, mech._id)}
                >
                  <View style={styles.mechAvatar}>
                    <FontAwesome5 name="wrench" size={16} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mechName}>{mech.name}</Text>
                    <Text style={styles.mechSkills}>{mech.skills?.join(', ') || 'General'}</Text>
                  </View>
                  <MaterialIcons name="add-circle-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  tabContainer: {
    marginBottom: 16,
  },
  tabScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityUrgent: { backgroundColor: '#ef4444' },
  priorityHigh: { backgroundColor: '#f97316' },
  priorityMedium: { backgroundColor: '#3b82f6' },
  priorityLow: { backgroundColor: '#64748b' },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  statusPending: { backgroundColor: '#f59e0b22' },
  statusAssigned: { backgroundColor: '#3b82f622' },
  statusCompleted: { backgroundColor: '#10b98122' },
  statusText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },
  
  date: { fontSize: 12, color: '#64748b' },
  complaintTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  complaintDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 16 },
  
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 8,
  },
  assignBtnText: { color: '#fff', fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 24, textAlign: 'center' },
  mechItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mechAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3b82f622',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mechName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mechSkills: { color: '#64748b', fontSize: 12, marginTop: 2 },
  noMechText: { color: '#64748b', textAlign: 'center', fontStyle: 'italic' }
});
