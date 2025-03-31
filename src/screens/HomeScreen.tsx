import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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
      setLoading(true);
      setError(null);
      const data = await medicationService.getMedications();
      console.log('Fetched medications:', data);
      setMedications(data);
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      setError(error.message || 'Error fetching medications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to fetch medications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchMedications();
    }, [])
  );

  const handleTakeMedication = async (id: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const medication = medications.find(m => m.id === id);
      if (!medication) return;

      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const nextTime = medication.times.find(time => time >= currentTime) || medication.times[0];
      
      await medicationService.toggleTaken(id, today, nextTime);
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
        {error && (
          <StyledView className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <StyledText className="text-red-600 text-center">{error}</StyledText>
          </StyledView>
        )}

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

        {medications.length === 0 ? (
          <StyledView className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <StyledText className="text-gray-500 text-center">
              No medications added yet. Add your first medication to get started!
            </StyledText>
          </StyledView>
        ) : (
          <StyledView className="space-y-4">
            {medications.map((medication) => (
              <StyledTouchableOpacity 
                key={medication.id} 
                className={`bg-white p-4 rounded-xl border ${medication.taken ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} shadow-sm`}
                onPress={() => navigation.navigate('MedicationDetails', { medicationId: medication.id })}
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
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTakeMedication(medication.id);
                      }}
                    >
                      <StyledText className={medication.taken ? 'text-green-600' : 'text-gray-400'}>✓</StyledText>
                    </StyledTouchableOpacity>
                    <StyledTouchableOpacity 
                      className="p-2 rounded-full bg-gray-100"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteMedication(medication.id);
                      }}
                    >
                      <StyledText className="text-gray-600">×</StyledText>
                    </StyledTouchableOpacity>
                  </StyledView>
                </StyledView>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        )}
      </StyledScrollView>
    </StyledView>
  );
}; 