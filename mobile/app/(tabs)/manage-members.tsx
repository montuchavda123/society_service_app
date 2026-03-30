import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Animated, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo, Feather } from '@expo/vector-icons';

export default function ManageMembersScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    flatNumber: '',
    role: 'Member' as 'Member' | 'Mechanic',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/society/members`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMembers(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMembers();
  }, []);

  const handleSaveMember = async () => {
    const { name, email, phone, flatNumber, role } = formData;
    if (!name || (!isEditing && !email)) {
      Alert.alert('Required', 'Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing 
        ? `${Config.BASE_URL}/society/members/${currentMemberId}`
        : `${Config.BASE_URL}/society/members`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        resetForm();
        fetchMembers();
        Alert.alert('Success', `User ${isEditing ? 'updated' : 'invited'}!`);
      } else {
        const errData = await response.json();
        Alert.alert('Error', errData.message || 'Failed to save');
      }
    } catch (error) {
      Alert.alert('Error', 'Server connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Remove User",
      `Are you sure you want to remove ${name} from your society?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${Config.BASE_URL}/society/members/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (response.ok) fetchMembers();
    } catch (error) {
       Alert.alert('Error', 'Failed to remove user');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', flatNumber: '', role: 'Member' });
    setIsEditing(false);
    setCurrentMemberId(null);
  };

  const openEdit = (m: any) => {
    setFormData({
      name: m.name,
      email: m.email,
      phone: m.phone || '',
      flatNumber: m.flatNumber || '',
      role: m.role,
    });
    setCurrentMemberId(m._id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'Mechanic' ? '#8b5cf622' : '#3b82f622' }]}>
          <FontAwesome5 name={item.role === 'Mechanic' ? 'wrench' : 'home'} size={18} color={item.role === 'Mechanic' ? '#8b5cf6' : '#3b82f6'} />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.subRow}>
            {item.flatNumber && <Text style={styles.subText}><Entypo name="location-pin" size={12} /> {item.flatNumber} • </Text>}
            <Text style={styles.roleLabel}>{item.role}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionIconButton} onPress={() => openEdit(item)}>
          <Feather name="edit-2" size={18} color="#94a3b8" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionIconButton, { marginLeft: 8 }]} 
          onPress={() => confirmDelete(item._id, item.name)}
          disabled={item._id === user?._id}
        >
          <MaterialIcons name="person-remove" size={20} color={item._id === user?._id ? '#1e293b' : '#ef4444'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Residents</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => { resetForm(); setModalVisible(true); }}>
           <Ionicons name="person-add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="group" size={64} color="#334155" />
              <Text style={styles.emptyText}>No residents listed yet</Text>
            </View>
          }
        />
      )}

      {/* MEMBER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Profile' : 'Add New Resident'}</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(val) => setFormData({ ...formData, name: val })}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#64748b"
                />
              </View>

              {!isEditing && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                    placeholder="rahul@email.com"
                    autoCapitalize="none"
                    placeholderTextColor="#64748b"
                  />
                </View>
              )}

              <View style={[styles.formRow, { gap: 12 }]}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Flat / Unit No.</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.flatNumber}
                    onChangeText={(val) => setFormData({ ...formData, flatNumber: val })}
                    placeholder="B-402"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(val) => setFormData({ ...formData, phone: val })}
                    placeholder="+91..."
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>User Role</Text>
                <View style={styles.rolePicker}>
                   <TouchableOpacity 
                     style={[styles.roleBtn, formData.role === 'Member' && styles.roleBtnActive]} 
                     onPress={() => setFormData({...formData, role: 'Member'})}
                   >
                     <Text style={[styles.roleBtnText, formData.role === 'Member' && styles.roleBtnTextActive]}>Member</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={[styles.roleBtn, formData.role === 'Mechanic' && styles.roleBtnActive]} 
                     onPress={() => setFormData({...formData, role: 'Mechanic'})}
                   >
                     <Text style={[styles.roleBtnText, formData.role === 'Mechanic' && styles.roleBtnTextActive]}>Mechanic</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.saveBtn]} 
                  onPress={handleSaveMember}
                  disabled={isSubmitting}
                >
                  <Text style={styles.btnText}>{isEditing ? 'Save Changes' : 'Onboard Member'}</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  addBtnHeader: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  roleLabel: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rolePicker: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#3b82f6',
  },
  roleBtnText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#31363f',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  }
});
