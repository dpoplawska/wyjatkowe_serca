import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import PomiaryScreen from '../screens/PomiaryScreen';
import InrScreen from '../screens/InrScreen';
import { colors } from '../theme/colors';
import { LogoutButton } from '../components/LogoutButton';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.grey2,
        headerTitleStyle: { color: colors.grey1 },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tab.Screen
        name="Profil"
        component={PatientProfileScreen}
        options={{
          title: 'Profil pacjenta',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Leki"
        component={MedicationsScreen}
        options={{
          title: 'Leki',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="pill" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Pomiary"
        component={PomiaryScreen}
        options={{
          title: 'Pomiary',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Inr"
        component={InrScreen}
        options={{
          title: 'Kalkulator INR',
          tabBarLabel: 'INR',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calculator-variant" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
