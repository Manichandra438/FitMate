import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { User } from 'firebase/auth';
import { colors } from '../theme';
import { isFirebaseConfigured } from '../services/firebase';

import HomeScreen from '../screens/HomeScreen';
import MealsScreen from '../screens/MealsScreen';
import FoodSearchScreen from '../screens/FoodSearchScreen';
import WeightScreen from '../screens/WeightScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WaterScreen from '../screens/WaterScreen';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

export type RootStackParamList = {
  Tabs: undefined;
  FoodSearch: { mealId: string; mealName: string };
  Exercise: undefined;
  Water: undefined;
  EditProfile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Meals: undefined;
  Progress: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={WeightScreen}
        options={{
          tabBarLabel: 'Weight',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-down" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

interface Props {
  user: User | null;
  initializing: boolean;
  hydrating: boolean;
  hydrated: boolean;
  onboarded: boolean;
}

const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

export default function AppNavigator({
  user,
  initializing,
  hydrating,
  hydrated,
  onboarded,
}: Props) {
  let content: React.ReactNode;

  // Dev bypass: Firebase not configured → skip auth gate so the whole flow
  // (onboarding included) can be tested without a Firebase project set up.
  const devBypass = !isFirebaseConfigured();

  // Local-first gate. Order matters:
  // 1. Wait only for the local store to rehydrate (fast, AsyncStorage read).
  // 2. If we already have an onboarded profile locally, render the app NOW —
  //    Firebase auth restore + cloud sync continue in the background. This is
  //    what makes returning users skip the multi-second auth splash.
  // 3. No local profile yet → fall back to the auth-driven flow.
  if (!hydrated) {
    content = <SplashScreen />;
  } else if (onboarded) {
    content = <MainApp />;
  } else if (devBypass) {
    content = <OnboardingScreen />;
  } else if (initializing || hydrating) {
    content = <SplashScreen />;
  } else if (!user) {
    content = <LoginScreen />;
  } else {
    content = <OnboardingScreen />;
  }

  return <NavigationContainer theme={navTheme}>{content}</NavigationContainer>;
}

function MainApp() {
  return (
    <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FoodSearch"
          component={FoodSearchScreen}
          options={({ route }) => ({
            title: `Add to ${route.params.mealName}`,
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen
          name="Exercise"
          component={ExerciseScreen}
          options={{ title: 'Exercise', headerBackTitle: 'Home' }}
        />
        <Stack.Screen
          name="Water"
          component={WaterScreen}
          options={{ title: 'Water', headerBackTitle: 'Home' }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: 'Edit Profile', headerBackTitle: 'Settings' }}
        />
      </Stack.Navigator>
  );
}
