import React, { useEffect, useState } from 'react';
import { Linking, KeyboardAvoidingView, Platform } from 'react-native';
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
import EmergencyContactsScreen from './src/screens/crisis/EmergencyContactsScreen';
import ProfileScreen from './src/screens/user-management/ProfileScreen';
import EditProfileScreen from './src/screens/user-management/EditProfileScreen';
import ChangePasswordScreen from './src/screens/user-management/ChangePassword';

import EducationalContentScreen from './src/screens/resources/EducationalContentScreen';
import EducationalContentDetailScreen from './src/screens/resources/EducationalContentDetailScreen';
import EventsScreen from './src/screens/resources/EventsScreen';
import EventDetailScreen from './src/screens/resources/EventDetailScreen';

import { supabase } from './src/lib/supabase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ['mentalhealthapp://'],
  config: {
    screens: {
      ChangePassword: 'reset-password',
      Landing: 'landing',
      Login: 'login',
      Registration: 'registration',
      ForgotPassword: 'forgot-password',
      Main: {
        screens: {
          Monitoring: 'monitoring',
          Analysis: 'analysis',
          Doctors: 'doctors',
          Emergency: 'emergency',
          Profile: 'profile',
        },
      },
    },
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Monitoring"
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
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Analysis" component={EmotionalTrendScreen} options={{ title: 'Insight' }} />
      <Tab.Screen name="Doctors" component={DoctorRecommendationScreen} options={{ title: 'Resources' }} />
      <Tab.Screen
        name="Monitoring"
        component={MonitoringScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Crisis' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const normalizeAuthUrl = (url) => (url?.includes('#') ? url.replace('#', '?') : url);

    const getQueryParams = (url) => {
      const normalized = normalizeAuthUrl(url);
      if (!normalized || !normalized.includes('?')) return {};

      const query = normalized.split('?')[1] || '';
      const params = new URLSearchParams(query);

      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
      };
    };

    const hydrateSessionFromUrl = async (incomingUrl) => {
      try {
        const { access_token: accessToken, refresh_token: refreshToken } = getQueryParams(incomingUrl);

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch {
        // ignore malformed URLs
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsAuthLoading(false);
    });

    Linking.getInitialURL().then((url) => {
      hydrateSessionFromUrl(url);
    });

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      hydrateSessionFromUrl(url);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else {
        setIsPasswordRecovery(false);
      }
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      linkingSub?.remove?.();
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  if (isAuthLoading) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          key={session ? 'signed-in' : 'signed-out'}
          initialRouteName={isPasswordRecovery ? 'ChangePassword' : (session ? 'Main' : 'Landing')}
        >
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Set New Password' }} />
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

          {/* Crisis Screens */}
          <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{ title: 'Emergency Contact' }} />

          {/* Resources Screens */}
          <Stack.Screen name="EducationalContent" component={EducationalContentScreen} options={{ title: 'Educational Content' }} />
          <Stack.Screen name="EducationalContentDetail" component={EducationalContentDetailScreen} options={{ title: 'Content' }} />
          <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events & Activities' }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}
