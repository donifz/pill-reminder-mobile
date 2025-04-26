import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Medication } from '../services/medicationService';

type TodaysMedicationsCardProps = {
  medication: Medication;
};

export const TodaysMedicationsCard: React.FC<TodaysMedicationsCardProps> = ({ medication }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
  console.log("TodaysMedicationsCard received medication:", medication.name);
  
  const formatTime = (time: string) => {
    if (!time) return "N/A";
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return time; // Return original time string if formatting fails
    }
  };
  
  const getNextMedicationTime = () => {
    if (!medication.times || medication.times.length === 0) {
      console.log("No times defined for medication");
      return null;
    }
    
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
      
      // Sort times and find the next one
      const sortedTimes = [...medication.times].sort();
      console.log("Sorted times:", sortedTimes);
      const nextTime = sortedTimes.find(time => time > currentTime);
      
      // If no time is later today, return the first time (for tomorrow)
      const result = nextTime || sortedTimes[0];
      console.log("Next time:", result);
      return result;
    } catch (error) {
      console.error("Error getting next medication time:", error);
      return medication.times[0]; // Return first time if there's an error
    }
  };
  
  const nextTime = getNextMedicationTime();
  if (!nextTime) {
    console.log("No next time found, not rendering card");
    return null;
  }
  
  const handlePress = () => {
    navigation.navigate('PillReminder');
  };
  
  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Text style={styles.title}>{t('medications.nextDose')}</Text>
      <View style={styles.medicationDetails}>
        <View style={styles.infoSection}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <Text style={styles.timeText}>{t('common.today')}, {formatTime(nextTime)}</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={32} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  medicationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 