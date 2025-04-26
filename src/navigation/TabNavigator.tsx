import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { PillReminderScreen } from '../screens/PillReminderScreen';
import { MedicineScreen } from '../screens/MedicineScreen';
import { DoctorsScreen } from '../screens/DoctorsScreen';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

// Create a new type for the Tab Navigator
export type TabStackParamList = {
  HomeTab: undefined;
  PillReminder: undefined;
  Medicine: undefined;
  Doctors: undefined;
};

const Tab = createBottomTabNavigator<TabStackParamList>();

export const TabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PillReminder') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Medicine') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'Doctors') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: t('navigation.home'),
        }}
      />
      <Tab.Screen 
        name="PillReminder" 
        component={PillReminderScreen}
        options={{ 
          tabBarLabel: t('navigation.schedule'),
        }}
      />
      <Tab.Screen 
        name="Medicine" 
        component={MedicineScreen}
        options={{ 
          tabBarLabel: t('navigation.medicine'),
        }}
      />
      <Tab.Screen 
        name="Doctors" 
        component={DoctorsScreen}
        options={{ 
          tabBarLabel: t('navigation.doctors'),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
}); 