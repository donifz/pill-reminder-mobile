import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AddMedicationScreen } from '../screens/AddMedicationScreen';
import { MedicationDetailsScreen } from '../screens/MedicationDetailsScreen';
import { GuardianManagementScreen } from '../screens/GuardianManagementScreen';
import { AcceptGuardianInviteScreen } from '../screens/AcceptGuardianInviteScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import NotificationTestScreen from '../screens/NotificationTestScreen';
import { DoctorSearchScreen } from '../screens/DoctorSearchScreen';
import { MedicineSearchScreen } from '../screens/MedicineSearchScreen';
import { PharmacyListScreen } from '../screens/PharmacyListScreen';
import { PharmacyDetailsScreen } from '../screens/PharmacyDetailsScreen';
import { PillReminderScreen } from '../screens/PillReminderScreen';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
          <Stack.Screen name="GuardianManagement" component={GuardianManagementScreen} />
          <Stack.Screen name="AcceptGuardianInvite" component={AcceptGuardianInviteScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="NotificationTest" component={NotificationTestScreen} />
          <Stack.Screen name="DoctorSearch" component={DoctorSearchScreen} />
          <Stack.Screen name="MedicineSearch" component={MedicineSearchScreen} />
          <Stack.Screen name="PharmacyList" component={PharmacyListScreen} />
          <Stack.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} />
          <Stack.Screen name="PillReminder" component={PillReminderScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}; 