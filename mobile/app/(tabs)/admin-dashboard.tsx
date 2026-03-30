import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Config from '../../constants/Config';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: "#1e293b",
    backgroundGradientTo: "#1e293b",
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const pieData = stats ? [
    { name: 'Pending', population: stats.complaints.pending, color: '#f59e0b', legendFontColor: '#94a3b8', legendFontSize: 12 },
    { name: 'Active', population: stats.complaints.inProgress, color: '#3b82f6', legendFontColor: '#94a3b8', legendFontSize: 12 },
    { name: 'Closed', population: stats.complaints.completed, color: '#10b981', legendFontColor: '#94a3b8', legendFontSize: 12 },
  ] : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Overview</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* KPI Cards */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <FontAwesome5 name="building" size={24} color="#3b82f6" />
            <Text style={styles.cardValue}>{stats?.societies || 0}</Text>
            <Text style={styles.cardLabel}>Societies</Text>
          </View>
          <View style={styles.card}>
            <FontAwesome5 name="users" size={24} color="#10b981" />
            <Text style={styles.cardValue}>{stats?.users.total || 0}</Text>
            <Text style={styles.cardLabel}>Tot. Users</Text>
          </View>
          <View style={styles.card}>
            <FontAwesome5 name="wrench" size={24} color="#8b5cf6" />
            <Text style={styles.cardValue}>{stats?.users.mechanics || 0}</Text>
            <Text style={styles.cardLabel}>Mechanics</Text>
          </View>
          <View style={styles.card}>
            <FontAwesome5 name="clipboard-list" size={24} color="#f59e0b" />
            <Text style={styles.cardValue}>{stats?.complaints.total || 0}</Text>
            <Text style={styles.cardLabel}>Tickets</Text>
          </View>
        </View>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>Complaints Distribution</Text>
        <View style={styles.chartCard}>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>

        <Text style={styles.sectionTitle}>User Growth</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={{
              labels: ["Sec", "Mem", "Mech"],
              datasets: [{
                data: [
                  stats?.users.secretaries || 0,
                  stats?.users.members || 0,
                  stats?.users.mechanics || 0
                ]
              }]
            }}
            width={screenWidth - 80}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero={true}
          />
        </View>
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
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
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
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  }
});
