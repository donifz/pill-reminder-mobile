import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { styled } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Medication, medicationService } from '../services/medicationService';
import NotificationService from '../services/notificationService';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);

type MedicationDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicationDetails'>;
  route: RouteProp<RootStackParamList, 'MedicationDetails'>;
};

type EditMedicationParams = {
  medication: Medication;
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const notificationService = NotificationService.getInstance();

export const MedicationDetailsScreen = ({ navigation, route }: MedicationDetailsScreenProps) => {
  const { id } = route.params;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { t } = useTranslation();

  const fetchMedication = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await medicationService.getMedicationById(id);
      console.log('Fetched medication details:', data);
      setMedication(data);
    } catch (error: any) {
      console.error('Error fetching medication details:', error);
      setError(error.message || 'Error fetching medication details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const setupNotifications = async () => {
    if (!medication) return;
    
    try {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        console.log('Setting up notifications for medication:', medication.name);
        // Cancel any existing notifications first
        await notificationService.cancelMedicationReminder(medication.id);
        
        // Schedule notifications for each time
        for (const time of medication.times) {
          console.log(`Scheduling notification for ${medication.name} at ${time}`);
          const identifier = await notificationService.scheduleMedicationReminder(
            medication.id,
            medication.name,
            time
          );
          console.log(`Notification scheduled with ID: ${identifier}`);
        }
        setNotificationsEnabled(true);
      } else {
        console.log('Notification permission not granted');
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setError('Failed to set up medication reminders');
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    fetchMedication();
    
    return () => {
      if (medication) {
        notificationService.cancelMedicationReminder(medication.id);
      }
    };
  }, [id]);

  const toggleNotifications = async (enabled: boolean) => {
    try {
      if (enabled) {
        if (medication) {
          console.log('Enabling notifications for medication:', medication.name);
          // Cancel any existing notifications first
          await notificationService.cancelMedicationReminder(medication.id);
          
          // Schedule notifications for each time
          for (const time of medication.times) {
            console.log(`Scheduling notification for ${medication.name} at ${time}`);
            const identifier = await notificationService.scheduleMedicationReminder(
              medication.id,
              medication.name,
              time
            );
            console.log(`Notification scheduled with ID: ${identifier}`);
          }
        }
      } else {
        if (medication) {
          console.log('Disabling notifications for medication:', medication.name);
          await notificationService.cancelMedicationReminder(medication.id);
        }
      }
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setError('Error updating notification settings. Please try again.');
    }
  };

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
      // Cancel all notifications for this medication before deleting
      await notificationService.cancelMedicationReminder(id);
      await medicationService.deleteMedication(id);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Error deleting medication. Please try again later.');
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      if (medication) {
        await notificationService.cancelMedicationReminder(medication.id);
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      if (medication) {
        await notificationService.scheduleMedicationReminder(
          medication.id,
          medication.name,
          medication.times[0]
        );
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const formatDate = (date: Date) => {
    const weekday = format(date, 'EEEE');
    const monthDay = format(date, 'MMMM d');
    return {
      weekday: t(`common.weekdays.${weekday.toLowerCase()}`),
      monthDay: t(`common.months.${format(date, 'MMMM').toLowerCase()}`) + ' ' + format(date, 'd')
    };
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
            <StyledText className="text-gray-500 ml-1">{t('medications.backToMedications')}</StyledText>
          </StyledTouchableOpacity>
          
          <StyledView className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <StyledView className="flex-row justify-between items-center mb-4">
              <StyledText className="text-xl font-semibold">{medication.name}</StyledText>
              <StyledView className="flex-row">
                <StyledTouchableOpacity
                  onPress={() => navigation.navigate('EditMedication', { id: medication.id })}
                  className="mr-4"
                >
                  <Ionicons name="pencil" size={20} color="#3B82F6" />
                </StyledTouchableOpacity>
                <StyledTouchableOpacity onPress={handleDeleteMedication}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>
            
            <StyledView className="mb-4">
              <StyledText className="text-gray-600">{t('medications.dose')}: {medication.dose}</StyledText>
              <StyledText className="text-gray-600">
                {t('medications.times')}: {medication.times.map(formatTime).join(', ')}
              </StyledText>
              <StyledText className="text-gray-600">
                {t('medications.duration')}: {medication.duration} {t('medications.days')}
              </StyledText>
            </StyledView>
            
            <StyledView className="flex-row justify-between items-center">
              <StyledText className="text-gray-600">{t('medications.notifications')}</StyledText>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={notificationsEnabled ? '#2563EB' : '#9CA3AF'}
              />
            </StyledView>
          </StyledView>
          
          <StyledView className="bg-white rounded-lg p-4 shadow-sm">
            <StyledText className="text-lg font-semibold mb-4">{t('medications.progress')}</StyledText>
            <StyledView className="h-2 bg-gray-200 rounded-full mb-2">
              <StyledView
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${getProgress()}%` }}
              />
            </StyledView>
            <StyledText className="text-gray-600 text-center">
              {getProgress()}% {t('medications.complete')}
            </StyledText>
          </StyledView>
          
          <StyledView className="mt-4">
            <StyledText className="text-lg font-semibold mb-4">{t('medications.schedule')}</StyledText>
            <StyledView className="bg-white rounded-lg p-4 shadow-sm">
              {days.map((date) => (
                <StyledView key={date.toISOString()} className="mb-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 last:mb-0">
                  <StyledView className="flex-row justify-between items-center mb-2">
                    <StyledText className="text-gray-900 font-medium">
                      {formatDate(date).weekday}
                    </StyledText>
                    <StyledText className="text-gray-500">
                      {formatDate(date).monthDay}
                    </StyledText>
                  </StyledView>
                  <StyledView className="flex-row flex-wrap gap-2">
                    {medication.times.map((time) => (
                      <StyledTouchableOpacity
                        key={time}
                        onPress={() => isToday(date) ? handleTakeMedication(time) : null}
                        className={`px-4 py-2 rounded-lg ${
                          isTimeTaken(date, time)
                            ? 'bg-green-50 border border-green-200'
                            : isToday(date)
                            ? 'bg-gray-50 border border-gray-200'
                            : 'bg-gray-100 border border-gray-200 opacity-50'
                        }`}
                        disabled={!isToday(date)}
                      >
                        <StyledText
                          className={
                            isTimeTaken(date, time)
                              ? 'text-green-700 font-medium'
                              : isToday(date)
                              ? 'text-gray-700'
                              : 'text-gray-500'
                          }
                        >
                          {formatTime(time)}
                        </StyledText>
                      </StyledTouchableOpacity>
                    ))}
                  </StyledView>
                </StyledView>
              ))}
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}; 