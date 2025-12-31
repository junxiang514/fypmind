import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import LandingScreen from './src/screens/user-management/LandingScreen';
import LoginScreen from './src/screens/user-management/LoginScreen';
import RegistrationScreen from './src/screens/user-management/RegistrationScreen';
import ForgotPasswordScreen from './src/screens/user-management/ForgotPasswordScreen';
import MonitoringScreen from './src/screens/monitoring/MonitoringScreen';
import DailyAssessmentScreen from './src/screens/monitoring/DailyAssessmentScreen';
import ClinicalToolsScreen from './src/screens/monitoring/ClinicalToolsScreen';
import AIChatScreen from './src/screens/monitoring/AIChatScreen';
import EmotionalTrendScreen from './src/screens/trend/EmotionalTrendScreen';
import DoctorRecommendationScreen from './src/screens/doctor/DoctorRecommendationScreen';
import EmergencyScreen from './src/screens/crisis/EmergencyScreen';
import ProfileScreen from './src/screens/user-management/ProfileScreen';
import EditProfileScreen from './src/screens/user-management/EditProfileScreen';

import { supabase } from './src/lib/supabase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Monitoring') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'Analysis') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Doctors') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'Emergency') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Monitoring" component={MonitoringScreen} options={{ title: 'Mental Health' }} />
      <Tab.Screen name="Analysis" component={EmotionalTrendScreen} options={{ title: 'Trends' }} />
      <Tab.Screen name="Doctors" component={DoctorRecommendationScreen} options={{ title: 'Doctors' }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Crisis' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  if (isAuthLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={session ? 'signed-in' : 'signed-out'}
        initialRouteName={session ? 'Main' : 'Landing'}
      >
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password' }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        
        {/* Nested Screens for Monitoring */}
        <Stack.Screen name="DailyAssessment" component={DailyAssessmentScreen} options={{ title: 'Daily Assessment' }} />
        <Stack.Screen name="ClinicalTools" component={ClinicalToolsScreen} options={{ title: 'Clinical Tools' }} />
        <Stack.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI Chat' }} />
        
        {/* Profile Screens */}
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
