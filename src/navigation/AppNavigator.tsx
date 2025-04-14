import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AddMedicationScreen } from '../screens/AddMedicationScreen';
import { MedicationDetailsScreen } from '../screens/MedicationDetailsScreen';
import { GuardianManagementScreen } from '../screens/GuardianManagementScreen';
import { AcceptGuardianInviteScreen } from '../screens/AcceptGuardianInviteScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="MedicationDetails" component={MedicationDetailsScreen} />
          <Stack.Screen name="GuardianManagement" component={GuardianManagementScreen} />
          <Stack.Screen name="AcceptGuardianInvite" component={AcceptGuardianInviteScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
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