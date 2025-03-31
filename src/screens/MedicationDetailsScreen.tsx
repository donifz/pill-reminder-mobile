import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { medicationService, Medication } from '../services/medicationService';
import { TouchableOpacity } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

type MedicationDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicationDetails'>;
  route: RouteProp<RootStackParamList, 'MedicationDetails'>;
};

export const MedicationDetailsScreen = ({ navigation, route }: MedicationDetailsScreenProps) => {
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMedicationDetails();
  }, []);

  const loadMedicationDetails = async () => {
    try {
      const data = await medicationService.getMedicationById(route.params.medicationId);
      setMedication(data);
    } catch (err: any) {
      setError('Failed to load medication details');
      console.error('Error loading medication:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationService.deleteMedication(route.params.medicationId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </StyledView>
    );
  }

  if (error) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-50 p-4">
        <StyledText className="text-red-600 text-center mb-4">{error}</StyledText>
        <StyledTouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <StyledText className="text-white font-semibold">Go Back</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    );
  }

  if (!medication) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-50 p-4">
        <StyledText className="text-gray-600 text-center mb-4">
          Medication not found
        </StyledText>
        <StyledTouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <StyledText className="text-white font-semibold">Go Back</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-gray-50 p-4">
      <StyledView className="bg-white rounded-xl p-6 shadow-sm">
        <StyledText className="text-2xl font-bold text-gray-900 mb-4">
          {medication.name}
        </StyledText>

        <StyledView className="space-y-4">
          <StyledView>
            <StyledText className="text-sm font-medium text-gray-500">
              Dosage
            </StyledText>
            <StyledText className="text-lg text-gray-900">
              {medication.dosage}
            </StyledText>
          </StyledView>

          <StyledView>
            <StyledText className="text-sm font-medium text-gray-500">
              Frequency
            </StyledText>
            <StyledText className="text-lg text-gray-900">
              {medication.frequency}
            </StyledText>
          </StyledView>

          <StyledView>
            <StyledText className="text-sm font-medium text-gray-500">
              Time
            </StyledText>
            <StyledText className="text-lg text-gray-900">
              {medication.time}
            </StyledText>
          </StyledView>
        </StyledView>

        <StyledView className="flex-row justify-end space-x-4 mt-8">
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-gray-200 px-6 py-3 rounded-xl"
          >
            <StyledText className="text-gray-800 font-semibold">
              Back
            </StyledText>
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            onPress={handleDelete}
            className="bg-red-600 px-6 py-3 rounded-xl"
          >
            <StyledText className="text-white font-semibold">
              Delete
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}; 