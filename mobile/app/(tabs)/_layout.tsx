import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isSecretary = user?.role === 'Secretary';
  const isMember = user?.role === 'Member';
  const isMechanic = user?.role === 'Mechanic';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
      }}>
      
      {/* Standard Home Tab - Hidden for Admin/Secretary/Member/Mechanic */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          href: (isSuperAdmin || isSecretary || isMember || isMechanic) ? null : '/',
        }}
      />

      {/* Super Admin Tabs */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Stats',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          href: isSuperAdmin ? '/admin-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="admin-societies"
        options={{
          title: 'Societies',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="building" color={color} />,
          href: isSuperAdmin ? '/admin-societies' : null,
        }}
      />
      <Tabs.Screen
        name="admin-mechanics"
        options={{
          title: 'Mechanics',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="wrench" color={color} />,
          href: isSuperAdmin ? '/admin-mechanics' : null,
        }}
      />

      {/* Secretary Tabs */}
      <Tabs.Screen
        name="secretary-dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
          href: isSecretary ? '/secretary-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="manage-members"
        options={{
          title: 'Members',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          href: isSecretary ? '/manage-members' : null,
        }}
      />
      <Tabs.Screen
        name="manage-complaints"
        options={{
          title: 'Complaints',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="clipboard" color={color} />,
          href: isSecretary ? '/manage-complaints' : null,
        }}
      />

      {/* Member Tabs */}
      <Tabs.Screen
        name="member-dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
          href: isMember ? '/member-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="member-complaints"
        options={{
          title: 'Report',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
          href: isMember ? '/member-complaints' : null,
        }}
      />
      <Tabs.Screen
        name="member-history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
          href: isMember ? '/member-history' : null,
        }}
      />

      {/* Mechanic Tabs */}
      <Tabs.Screen
        name="mechanic-dashboard"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
          href: isMechanic ? '/mechanic-dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="mechanic-jobs"
        options={{
          title: 'My Jobs',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="wrench" color={color} />,
          href: isMechanic ? '/mechanic-jobs' : null,
        }}
      />

      {/* Legacy Report Tab - Hidden for Everyone now (deprecated) */}
      <Tabs.Screen
        name="complaint"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
