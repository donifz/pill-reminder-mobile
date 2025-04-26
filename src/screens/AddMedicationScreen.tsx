import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { medicationService } from '../services/medicationService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);

type AddMedicationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddMedication'>;
};

export const AddMedicationScreen = ({ navigation }: AddMedicationScreenProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [duration, setDuration] = useState('7');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTime = () => {
    setTimes([...times, '09:00']);
  };

  const handleRemoveTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, selectedTime: Date | undefined) => {
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const newTimes = [...times];
      newTimes[index] = timeString;
      setTimes(newTimes);
    }
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    setSelectedTimeIndex(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const showTimePickerForIndex = (index: number) => {
    setSelectedTimeIndex(index);
    setShowTimePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!name || !dose || times.length === 0 || !duration) {
      setError(t('common.fillAllFields'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      const start = startDate;
      const end = addDays(start, parseInt(duration) - 1);
      
      const medication = {
        name,
        dose,
        times: times.sort(),
        duration: parseInt(duration),
        startDate: formatDate(start),
        endDate: formatDate(end),
      };
      
      console.log('Creating medication with data:', medication);

      const result = await medicationService.createMedication(medication);
      console.log('Medication created successfully:', {
        id: result.id,
        name: result.name,
        startDate: result.startDate,
        endDate: result.endDate,
        times: result.times
      });
      
      // Reset form
      setName('');
      setDose('');
      setTimes(['09:00']);
      setDuration('7');
      setStartDate(new Date());
      
      // Force refresh and navigate directly to PillReminder screen to see the new medication
      console.log('Navigating to PillReminder screen after medication creation');
      setTimeout(() => {
        navigation.navigate('PillReminder');
      }, 500);
    } catch (err: any) {
      console.error('Add medication error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(
        err.response?.data?.message ||
        err.message ||
        t('medications.saveError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <StyledScrollView className="flex-1">
        <StyledView className="px-4 pt-6">
          <StyledView className="mb-4">
            <StyledTouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-row items-center mb-6"
            >
              <StyledText className="text-gray-500">
                {t('common.back')}
              </StyledText>
            </StyledTouchableOpacity>
            <StyledText className="text-3xl font-bold text-gray-900">
              {t('medications.addMedication')}
            </StyledText>
            <StyledText className="text-gray-600 mt-2">
              {t('medications.enterDetails')}
            </StyledText>
          </StyledView>

          {error && (
            <StyledView className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <StyledText className="text-red-600 text-center">{error}</StyledText>
            </StyledView>
          )}

          <StyledView className="space-y-4">
            <StyledView>
              <StyledText className="text-sm font-semibold text-gray-700 mb-1">
                {t('medications.medicationName')}
              </StyledText>
              <StyledTextInput
                value={name}
                onChangeText={setName}
                placeholder={t('medications.enterMedicationName')}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </StyledView>

            <StyledView>
              <StyledText className="text-sm font-semibold text-gray-700 mb-1">
                {t('medications.dose')}
              </StyledText>
              <StyledTextInput
                value={dose}
                onChangeText={setDose}
                placeholder={t('medications.enterDose')}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </StyledView>

            <StyledView>
              <StyledView className="flex-row justify-between items-center mb-2">
                <StyledText className="text-sm font-semibold text-gray-700">
                  {t('medications.times')}
                </StyledText>
                <StyledTouchableOpacity
                  onPress={handleAddTime}
                  className="flex-row items-center"
                >
                  <StyledText className="text-blue-600 font-medium">
                    {t('medications.addTime')}
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>

              {times.map((time, index) => (
                <StyledView key={index} className="flex-row items-center mb-2">
                  <StyledTouchableOpacity
                    onPress={() => showTimePickerForIndex(index)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mr-2"
                  >
                    <StyledText className="text-gray-900">
                      {time}
                    </StyledText>
                  </StyledTouchableOpacity>
                  {times.length > 1 && (
                    <StyledTouchableOpacity
                      onPress={() => handleRemoveTime(index)}
                      className="p-2"
                    >
                      <StyledText className="text-gray-400 text-xl">×</StyledText>
                    </StyledTouchableOpacity>
                  )}
                </StyledView>
              ))}
            </StyledView>

            <StyledView>
              <StyledText className="text-sm font-semibold text-gray-700 mb-1">
                {t('medications.startDate')}
              </StyledText>
              <StyledTouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <StyledText className="text-gray-900">
                  {startDate.toLocaleDateString()}
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView>
              <StyledText className="text-sm font-semibold text-gray-700 mb-1">
                {t('medications.durationDays')}
              </StyledText>
              <StyledTextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              <StyledText className="mt-2 text-sm text-gray-500">
                {t('medications.endDate')}: {addDays(startDate, parseInt(duration) - 1).toLocaleDateString()}
              </StyledText>
            </StyledView>

            {showTimePicker && selectedTimeIndex !== null && (
              <DateTimePicker
                value={new Date(`2000-01-01T${times[selectedTimeIndex]}`)}
                mode="time"
                is24Hour={true}
                onChange={(event, date) => handleTimeChange(selectedTimeIndex, date)}
              />
            )}

            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            <StyledTouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`bg-blue-600 py-4 rounded-xl mt-6 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <StyledText className="text-white font-semibold text-center">
                  {t('medications.save')}
                </StyledText>
              )}
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-4"
            >
              <StyledText className="text-blue-600 text-center">
                {t('common.cancel')}
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 