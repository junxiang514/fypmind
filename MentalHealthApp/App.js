import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import MonitoringScreen from './src/screens/MonitoringScreen';
import DailyAssessmentScreen from './src/screens/DailyAssessmentScreen';
import ClinicalToolsScreen from './src/screens/ClinicalToolsScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import EmotionalTrendScreen from './src/screens/EmotionalTrendScreen';
import DoctorRecommendationScreen from './src/screens/DoctorRecommendationScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';

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
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        
        {/* Nested Screens for Monitoring */}
        <Stack.Screen name="DailyAssessment" component={DailyAssessmentScreen} options={{ title: 'Daily Assessment' }} />
        <Stack.Screen name="ClinicalTools" component={ClinicalToolsScreen} options={{ title: 'Clinical Tools' }} />
        <Stack.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI Chat' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
