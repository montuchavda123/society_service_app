import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Animated } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function AdminSocietiesScreen() {
  const { user } = useAuth();
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSocieties = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/admin/societies`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSocieties(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSocieties();
  }, []);

  const handleAddSociety = async () => {
    if (!newSocietyName.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${Config.BASE_URL}/admin/societies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ name: newSocietyName }),
      });
      if (response.ok) {
        setModalVisible(false);
        setNewSocietyName('');
        fetchSocieties();
        Alert.alert('Success', 'Society created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create society');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Society",
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${Config.BASE_URL}/admin/societies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (response.ok) {
        fetchSocieties();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete society');
    }
  };

  const renderSocietyItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.iconBox}>
          <FontAwesome5 name="building" size={20} color="#3b82f6" />
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>CODE: </Text>
            <Text style={styles.codeValue}>{item.societyCode}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item._id, item.name)}>
          <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Societies</Text>
        <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={societies}
          renderItem={renderSocietyItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="business" size={64} color="#334155" />
              <Text style={styles.emptyText}>No societies registered yet</Text>
            </View>
          }
        />
      )}

      {/* ADD SOCIETY MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Society</Text>
            <TextInput
              style={styles.input}
              placeholder="Society Name (e.g. Green Valley)"
              placeholderTextColor="#64748b"
              value={newSocietyName}
              onChangeText={setNewSocietyName}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]} 
                onPress={handleAddSociety}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addIconBtn: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3b82f622',
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
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actions: {
    marginLeft: 12,
  },
  deleteBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ef444411',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
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
  submitBtn: {
    backgroundColor: '#3b82f6',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
