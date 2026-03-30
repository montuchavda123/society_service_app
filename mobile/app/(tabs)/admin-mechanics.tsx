import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Animated, Switch, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';

export default function AdminMechanicsScreen() {
  const { user } = useAuth();
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMechId, setCurrentMechId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    skills: '',
    societyId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [mechRes, socRes] = await Promise.all([
        fetch(`${Config.BASE_URL}/admin/mechanics`, { headers: { Authorization: `Bearer ${user?.token}` } }),
        fetch(`${Config.BASE_URL}/admin/societies`, { headers: { Authorization: `Bearer ${user?.token}` } })
      ]);
      
      const mechData = await mechRes.json();
      const socData = await socRes.json();
      
      if (mechRes.ok) setMechanics(mechData);
      if (socRes.ok) setSocieties(socData);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${Config.BASE_URL}/admin/mechanics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (response.ok) fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSaveMechanic = async () => {
    const { name, email, password, phone, skills, societyId } = formData;
    if (!name || !email || (!isEditing && !password) || !societyId) {
      Alert.alert('Required', 'Please fill all mandatory fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing 
        ? `${Config.BASE_URL}/admin/mechanics/${currentMechId}`
        : `${Config.BASE_URL}/admin/mechanics`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        skills: skills.split(',').map(s => s.trim()).filter(s => s !== '')
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalVisible(false);
        resetForm();
        fetchData();
        Alert.alert('Success', `Mechanic ${isEditing ? 'updated' : 'registered'}!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save mechanic');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', skills: '', societyId: '' });
    setIsEditing(false);
    setCurrentMechId(null);
  };

  const openEdit = (mech: any) => {
    setFormData({
      name: mech.name,
      email: mech.email,
      password: '', // Don't show password
      phone: mech.phone || '',
      skills: mech.skills?.join(', ') || '',
      societyId: mech.societyId?._id || '',
    });
    setCurrentMechId(mech._id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const renderMechanicItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.mechMain}>
          <View style={styles.avatar}>
            <FontAwesome5 name="user-cog" size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.societyName}>{item.societyId?.name || 'Unassigned'}</Text>
          </View>
        </View>
        <Switch
          value={item.isAvailable}
          onValueChange={() => handleToggleAvailability(item._id, item.isAvailable)}
          trackColor={{ false: "#334155", true: "#10b98133" }}
          thumbColor={item.isAvailable ? "#10b981" : "#94a3b8"}
        />
      </View>

      <View style={styles.skillsContainer}>
        {item.skills?.map((skill: string, index: number) => (
          <View key={index} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: item.isAvailable ? '#10b981' : '#ef4444' }]}>
              {item.isAvailable ? 'Available' : 'Busy / Offline'}
            </Text>
         </View>
         <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
           <MaterialIcons name="edit" size={20} color="#3b82f6" />
         </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Mechanics</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={mechanics}
          renderItem={renderMechanicItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        />
      )}

      {/* ADD/EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Mechanic' : 'Register Mechanic'}</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(val) => setFormData({ ...formData, name: val })}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#64748b"
                />
              </View>

              {!isEditing && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(val) => setFormData({ ...formData, email: val })}
                      placeholder="john@example.com"
                      autoCapitalize="none"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(val) => setFormData({ ...formData, password: val })}
                      secureTextEntry
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Assign Society</Text>
                <View style={styles.selectContainer}>
                  {societies.map((s) => (
                    <TouchableOpacity 
                      key={s._id} 
                      style={[styles.selectItem, formData.societyId === s._id && styles.selectedItem]}
                      onPress={() => setFormData({ ...formData, societyId: s._id })}
                    >
                      <Text style={[styles.selectText, formData.societyId === s._id && styles.selectedText]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Skills (Comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.skills}
                  onChangeText={(val) => setFormData({ ...formData, skills: val })}
                  placeholder="Plumbing, Electrical, AC"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.saveBtn]} 
                  onPress={handleSaveMechanic}
                  disabled={isSubmitting}
                >
                  <Text style={styles.btnText}>Save Mechanic</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#3b82f633',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mechMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf622',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  societyName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  skillBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f611',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    paddingTop: 100,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedItem: {
    backgroundColor: '#3b82f633',
    borderColor: '#3b82f6',
  },
  selectText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  selectedText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#334155',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
