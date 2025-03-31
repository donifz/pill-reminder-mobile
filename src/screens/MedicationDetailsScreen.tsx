import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Medication, medicationService } from '../services/medicationService';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

type MedicationDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicationDetails'>;
  route: RouteProp<RootStackParamList, 'MedicationDetails'>;
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export const MedicationDetailsScreen = ({ navigation, route }: MedicationDetailsScreenProps) => {
  const { medicationId } = route.params;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedication = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await medicationService.getMedicationById(medicationId);
      console.log('Fetched medication details:', data);
      setMedication(data);
    } catch (error: any) {
      console.error('Error fetching medication details:', error);
      setError(error.message || 'Error fetching medication details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedication();
  }, [medicationId]);

  const handleTakeMedication = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (!medication) return;

      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const nextTime = medication.times.find(time => time >= currentTime) || medication.times[0];
      
      await medicationService.toggleTaken(medication.id, today, nextTime);
      fetchMedication();
    } catch (error) {
      console.error('Error taking medication:', error);
      setError('Error taking medication. Please try again later.');
    }
  };

  const handleDeleteMedication = async () => {
    try {
      await medicationService.deleteMedication(medicationId);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Error deleting medication. Please try again later.');
    }
  };

  if (loading || !medication) {
    return (
      <StyledView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </StyledView>
    );
  }

  const days = medication.startDate && medication.endDate
    ? eachDayOfInterval({
        start: new Date(medication.startDate),
        end: new Date(medication.endDate),
      })
    : [];

  return (
    <StyledScrollView className="flex-1 bg-gray-50">
      <StyledView className="p-4">
        <StyledTouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center mb-6"
        >
          <Ionicons name="arrow-back" size={16} color="#6B7280" />
          <StyledText className="text-gray-500 ml-1">Back to medications</StyledText>
        </StyledTouchableOpacity>

        {error && (
          <StyledView className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <StyledText className="text-red-600 text-center">{error}</StyledText>
          </StyledView>
        )}

        <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <StyledText className="text-2xl font-bold text-gray-900 mb-4">
            {medication.name}
          </StyledText>
          
          <StyledView className="flex-row">
            <StyledView className="flex-1 space-y-4">
              <StyledView>
                <StyledText className="text-sm font-medium text-gray-500">Dose</StyledText>
                <StyledText className="text-lg text-gray-900">{medication.dose}</StyledText>
              </StyledView>
              
              <StyledView>
                <StyledText className="text-sm font-medium text-gray-500">Time</StyledText>
                <StyledView className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                  <StyledText className="text-lg text-gray-900 ml-2">
                    {medication.times.map(formatTime).join(', ')}
                  </StyledText>
                </StyledView>
              </StyledView>

              <StyledView>
                <StyledText className="text-sm font-medium text-gray-500">Duration</StyledText>
                <StyledView className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                  <StyledText className="text-lg text-gray-900 ml-2">
                    {format(new Date(medication.startDate), 'MMM d, yyyy')} - {format(new Date(medication.endDate), 'MMM d, yyyy')}
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>

            <StyledView className="flex-1">
              <StyledText className="text-sm font-medium text-gray-500 mb-4">Progress</StyledText>
              <StyledView className="bg-gray-100 rounded-lg p-4">
                <StyledView className="items-center">
                  <StyledText className="text-3xl font-bold text-blue-600">
                    {medication.takenDates?.length || 0}/{medication.duration}
                  </StyledText>
                  <StyledText className="text-sm text-gray-500">days completed</StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>

        <StyledView className="bg-white rounded-2xl shadow-lg p-6">
          <StyledText className="text-xl font-semibold text-gray-900 mb-6">Calendar</StyledText>
          <StyledView className="flex-row flex-wrap justify-between">
            {days.map((day) => {
              const isTaken = medication.takenDates?.some(date => 
                isSameDay(new Date(date), day)
              );
              const isToday = isSameDay(day, new Date());
              
              return (
                <StyledView
                  key={day.toISOString()}
                  className={`w-[14%] aspect-square p-2 rounded-lg items-center justify-center mb-2
                    ${isToday ? 'border-2 border-blue-500' : ''}
                    ${isTaken ? 'bg-green-50' : 'bg-gray-50'}`}
                >
                  <StyledText className="text-sm font-medium text-gray-900">
                    {format(day, 'd')}
                  </StyledText>
                  <StyledText className="text-xs text-gray-500">
                    {format(day, 'MMM')}
                  </StyledText>
                  {isTaken ? (
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  ) : (
                    <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                  )}
                </StyledView>
              );
            })}
          </StyledView>
        </StyledView>

        <StyledView className="flex-row space-x-4 mt-6">
          <StyledTouchableOpacity
            onPress={handleTakeMedication}
            className={`flex-1 py-4 rounded-xl ${
              medication.taken ? 'bg-green-100' : 'bg-blue-600'
            }`}
          >
            <StyledText className={`text-center font-semibold ${
              medication.taken ? 'text-green-600' : 'text-white'
            }`}>
              {medication.taken ? 'Taken' : 'Take Medication'}
            </StyledText>
          </StyledTouchableOpacity>
          <StyledTouchableOpacity
            onPress={handleDeleteMedication}
            className="flex-1 py-4 rounded-xl bg-red-100"
          >
            <StyledText className="text-red-600 text-center font-semibold">
              Delete
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledScrollView>
  );
}; 