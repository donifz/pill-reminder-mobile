import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Medication, medicationService } from '../services/medicationService';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);

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

  const handleTakeMedication = async (time: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (!medication) return;

      await medicationService.toggleTaken(medication.id, today, time);
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
      <StyledSafeAreaView className="flex-1 bg-gray-50">
        <StyledView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </StyledView>
      </StyledSafeAreaView>
    );
  }

  const days = medication.startDate && medication.endDate
    ? eachDayOfInterval({
        start: new Date(medication.startDate),
        end: new Date(medication.endDate),
      })
    : [];

  const getTakenTimesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const takenDate = medication.takenDates?.find(td => td.date === dateStr);
    return takenDate?.times || [];
  };

  const isTimeTaken = (date: Date, time: string) => {
    const takenTimes = getTakenTimesForDate(date);
    return takenTimes.includes(time);
  };

  const getProgress = () => {
    if (!medication.takenDates) return 0;
    const totalDays = medication.duration;
    const takenDays = medication.takenDates.length;
    return Math.round((takenDays / totalDays) * 100);
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      <StyledScrollView className="flex-1">
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
                      {getProgress()}%
                    </StyledText>
                    <StyledText className="text-sm text-gray-500">completed</StyledText>
                  </StyledView>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>

          <StyledView className="bg-white rounded-2xl shadow-lg p-6">
            <StyledText className="text-xl font-semibold text-gray-900 mb-6">Calendar</StyledText>
            <StyledView className="flex-row flex-wrap justify-between">
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                const takenTimes = getTakenTimesForDate(day);
                const dayKey = `day-${format(day, 'yyyy-MM-dd')}`;
                
                return (
                  <StyledView
                    key={dayKey}
                    className={`w-[14%] aspect-square p-2 rounded-lg items-center justify-center mb-2
                      ${isToday ? 'border-2 border-blue-500' : ''}
                      ${takenTimes.length > 0 ? 'bg-green-50' : 'bg-gray-50'}`}
                  >
                    <StyledText className="text-sm font-medium text-gray-900">
                      {format(day, 'd')}
                    </StyledText>
                    <StyledText className="text-xs text-gray-500">
                      {format(day, 'MMM')}
                    </StyledText>
                    {takenTimes.length > 0 ? (
                      <StyledText className="text-xs text-green-600">
                        {takenTimes.length}/{medication.times.length}
                      </StyledText>
                    ) : (
                      <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                    )}
                  </StyledView>
                );
              })}
            </StyledView>
          </StyledView>

          <StyledView className="mt-6 mb-4">
            <StyledText className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</StyledText>
            <StyledView className="space-y-3">
              {medication.times.map((time) => {
                const isTaken = isTimeTaken(new Date(), time);
                return (
                  <StyledTouchableOpacity
                    key={time}
                    onPress={() => handleTakeMedication(time)}
                    className={`flex-row items-center justify-between p-4 rounded-xl ${
                      isTaken ? 'bg-green-50' : 'bg-blue-50'
                    }`}
                  >
                    <StyledView className="flex-row items-center">
                      <Ionicons 
                        name={isTaken ? "checkmark-circle" : "time-outline"} 
                        size={24} 
                        color={isTaken ? "#22C55E" : "#3B82F6"} 
                      />
                      <StyledText className={`ml-3 text-lg font-medium ${
                        isTaken ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {formatTime(time)}
                      </StyledText>
                    </StyledView>
                    <StyledText className={`text-sm ${
                      isTaken ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isTaken ? 'Taken' : 'Take Now'}
                    </StyledText>
                  </StyledTouchableOpacity>
                );
              })}
            </StyledView>
          </StyledView>

          <StyledTouchableOpacity
            onPress={handleDeleteMedication}
            className="py-4 rounded-xl bg-red-100 mb-4"
          >
            <StyledText className="text-red-600 text-center font-semibold">
              Delete Medication
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 