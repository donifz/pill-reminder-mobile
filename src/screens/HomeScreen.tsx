import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Medication, medicationService } from '../services/medicationService';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = async () => {
    try {
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Error fetching medications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleTakeMedication = async (id: string) => {
    try {
      await medicationService.takeMedication(id);
      fetchMedications();
    } catch (error) {
      console.error('Error taking medication:', error);
      setError('Error taking medication. Please try again later.');
    }
  };

  const handleDeleteMedication = async (id: string) => {
    try {
      await medicationService.deleteMedication(id);
      fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Error deleting medication. Please try again later.');
    }
  };

  if (loading) {
    return (
      <StyledView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-gray-50">
      <StyledView className="px-4 py-6 bg-white border-b border-gray-200">
        <StyledText className="text-2xl font-bold text-gray-900">
          Medications
        </StyledText>
      </StyledView>
      
      <StyledScrollView className="flex-1 px-4 py-4">
        <StyledTouchableOpacity
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4"
          onPress={() => navigation.navigate('AddMedication')}
        >
          <StyledView className="flex-row items-center justify-between">
            <StyledView>
              <StyledText className="text-lg font-medium text-gray-900">
                Add New Medication
              </StyledText>
              <StyledText className="text-sm text-gray-500 mt-1">
                Track your medications and set reminders
              </StyledText>
            </StyledView>
            <StyledView className="bg-blue-100 p-3 rounded-full">
              <StyledText className="text-blue-600 text-xl">+</StyledText>
            </StyledView>
          </StyledView>
        </StyledTouchableOpacity>

        <StyledView className="space-y-4">
          {medications.map((medication) => (
            <StyledView 
              key={medication.id} 
              className={`bg-white p-4 rounded-xl border ${medication.taken ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} shadow-sm`}
            >
              <StyledView className="flex-row justify-between items-start">
                <StyledView className="flex-1">
                  <StyledText className="text-lg font-medium text-gray-900">
                    {medication.name}
                  </StyledText>
                  <StyledText className="text-sm text-gray-500">
                    {medication.dose}
                  </StyledText>
                  <StyledView className="flex-row flex-wrap mt-2">
                    {medication.times.map((time, index) => (
                      <StyledView key={index} className="bg-gray-100 px-2 py-1 rounded-md mr-2 mb-2">
                        <StyledText className="text-sm text-gray-500">
                          {formatTime(time)}
                        </StyledText>
                      </StyledView>
                    ))}
                  </StyledView>
                </StyledView>
                <StyledView className="flex-row space-x-2">
                  <StyledTouchableOpacity 
                    className={`p-2 rounded-full ${medication.taken ? 'bg-green-100' : 'bg-gray-100'}`}
                    onPress={() => handleTakeMedication(medication.id)}
                  >
                    <StyledText className={medication.taken ? 'text-green-600' : 'text-gray-400'}>✓</StyledText>
                  </StyledTouchableOpacity>
                  <StyledTouchableOpacity 
                    className="p-2 rounded-full bg-gray-100"
                    onPress={() => handleDeleteMedication(medication.id)}
                  >
                    <StyledText className="text-gray-600">×</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              </StyledView>
            </StyledView>
          ))}
        </StyledView>
      </StyledScrollView>
    </StyledView>
  );
}; 