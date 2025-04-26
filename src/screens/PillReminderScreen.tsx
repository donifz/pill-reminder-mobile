import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  SectionList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { medicationService, Medication } from '../services/medicationService';
import { format } from 'date-fns';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

type PillReminderScreenRouteProp = RouteProp<RootStackParamList, 'PillReminder'>;
type PillReminderNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PillReminder'>;

export const PillReminderScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allMedications, setAllMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<PillReminderNavigationProp>();
  const { t } = useTranslation();
  
  // Create a loadMedications function that can be reused
  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      console.log('PillReminderScreen: Loading medications from API...');
      
      const response = await medicationService.getMedications();
      console.log(`PillReminderScreen: API returned ${response.userMedications?.length || 0} medications:`, 
        response.userMedications?.map(m => ({id: m.id, name: m.name}))
      );
      
      const todaysMedications = getTodaysMedications(response.userMedications);
      console.log(`PillReminderScreen: Filtered ${todaysMedications.length} medications for today:`, 
        todaysMedications.map(m => ({id: m.id, name: m.name}))
      );
      
      setMedications(todaysMedications);
      setAllMedications(response.userMedications);
    } catch (error) {
      console.error('PillReminderScreen: Error loading medications:', error);
      Alert.alert(t('common.error'), t('medications.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);
  
  // Initial load
  useEffect(() => {
    loadMedications();
  }, [loadMedications]);
  
  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('PillReminderScreen focused - reloading medications');
      
      // Small delay to ensure navigation is complete
      const timer = setTimeout(() => {
        loadMedications();
      }, 500);
      
      return () => clearTimeout(timer);
    }, [loadMedications])
  );
  
  const getTodaysMedications = (meds: Medication[]) => {
    if (!meds || meds.length === 0) {
      console.log('PillReminderScreen: No medications provided to filter');
      return [];
    }
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`PillReminderScreen: Filtering medications for ${today}`);
    
    return meds.filter(med => {
      console.log(`PillReminderScreen: Checking medication: ${med.name} (ID: ${med.id})`);
      console.log(`  - Start date: ${med.startDate}, End date: ${med.endDate}`);
      console.log(`  - Times: ${med.times?.join(', ') || 'none'}`);
      
      // If medication has startDate and endDate, check if today is within range
      if (med.startDate && med.endDate) {
        const startDate = new Date(med.startDate);
        const endDate = new Date(med.endDate);
        const todayDate = new Date(today);
        
        if (todayDate < startDate || todayDate > endDate) {
          console.log(`  - FILTERED OUT: Today (${today}) is not within range (${med.startDate} to ${med.endDate})`);
          return false;
        }
      }
      
      console.log(`  - INCLUDED: Medication ${med.name} is active for today`);
      return true;
    }).sort((a, b) => {
      const aNextTime = getNextMedicationTime(a);
      const bNextTime = getNextMedicationTime(b);
      
      if (!aNextTime) return 1;
      if (!bNextTime) return -1;
      
      return aNextTime.localeCompare(bNextTime);
    });
  };
  
  const getNextMedicationTime = (medication: Medication) => {
    if (!medication.times || medication.times.length === 0) return null;
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    
    // Sort times and find the next one
    const sortedTimes = [...medication.times].sort();
    const nextTime = sortedTimes.find(time => time > currentTime);
    
    // If no time is later today, return the first time (for tomorrow)
    return nextTime || sortedTimes[0];
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const isMedicationTakenToday = (medication: Medication, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todayTaken = medication.takenDates?.find(td => td.date === today);
    return todayTaken?.times.includes(time) || false;
  };
  
  const handleTakeMedication = async (medication: Medication, time: string) => {
    try {
      await medicationService.takeDose(medication.id, time);
      
      // Update local state
      setMedications(prevMeds => 
        prevMeds.map(med => {
          if (med.id === medication.id) {
            const today = new Date().toISOString().split('T')[0];
            const takenDates = [...(med.takenDates || [])];
            const todayIndex = takenDates.findIndex(td => td.date === today);
            
            if (todayIndex >= 0) {
              takenDates[todayIndex] = {
                ...takenDates[todayIndex],
                times: [...takenDates[todayIndex].times, time]
              };
            } else {
              takenDates.push({
                date: today,
                times: [time]
              });
            }
            
            return { ...med, takenDates };
          }
          return med;
        })
      );
      
    } catch (error) {
      console.error('Error taking medication:', error);
      Alert.alert(t('common.error'), t('medications.takeError'));
    }
  };
  
  const renderMedicationItem = (medication: Medication) => {
    return (
      <View key={medication.id} style={styles.medicationCard}>
        <TouchableOpacity 
          style={{flex: 1}} 
          onPress={() => navigation.navigate('MedicationDetails', { id: medication.id })}
        >
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationDose}>{medication.dose}</Text>
          </View>
          
          <View style={styles.timesList}>
            {medication.times.map((time, index) => {
              const isTaken = isMedicationTakenToday(medication, time);
              return (
                <View key={`${medication.id}-${time}`} style={styles.timeItem}>
                  <View style={styles.timeInfo}>
                    <Ionicons 
                      name={isTaken ? "checkmark-circle" : "time-outline"} 
                      size={24} 
                      color={isTaken ? "#10B981" : "#3B82F6"} 
                    />
                    <Text style={styles.timeText}>{formatTime(time)}</Text>
                  </View>
                  
                  {!isTaken && (
                    <TouchableOpacity 
                      style={styles.takeButton}
                      onPress={() => handleTakeMedication(medication, time)}
                    >
                      <Text style={styles.takeButtonText}>{t('common.takeNow')}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {isTaken && (
                    <View style={styles.takenContainer}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                      <Text style={styles.takenText}>{t('common.taken')}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaViewContext style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('medications.todaysSchedule')}</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <>
          {/* Add Medication Button above sections */}
          <View style={styles.addMedicationContainer}>
            <TouchableOpacity
              style={styles.addMedicationButton}
              onPress={() => navigation.navigate('AddMedication')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addMedicationButtonText}>{t('medications.addMedication')}</Text>
            </TouchableOpacity>
          </View>
          
          <SectionList
            sections={[
              { 
                title: 'Today\'s Schedule', 
                data: medications.length > 0 ? medications : [],
                renderItem: ({item}) => renderMedicationItem(item),
                ListEmptyComponent: () => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.emptyText}>{t('medications.noMedicationsToday')}</Text>
                  </View>
                )
              },
              { 
                title: 'Your Medications', 
                data: allMedications,
                renderItem: ({item}) => (
                  <View key={item.id} style={styles.medicationListCard}>
                    <TouchableOpacity 
                      style={{flex: 1}}
                      onPress={() => navigation.navigate('MedicationDetails', { id: item.id })}
                    >
                      <View style={styles.medicationCardHeader}>
                        <View style={styles.medicationCardTitle}>
                          <Text style={styles.medicationName}>{item.name}</Text>
                        </View>
                        <View style={styles.medicationCardActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleTakeMedication(item, getNextMedicationTime(item) || '')}
                          >
                            <Ionicons name="checkmark-circle" size={24} color="#9CA3AF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={async () => {
                              try {
                                await medicationService.deleteMedication(item.id);
                                setAllMedications(prevMeds => prevMeds.filter(med => med.id !== item.id));
                                setMedications(prevMeds => prevMeds.filter(med => med.id !== item.id));
                              } catch (error) {
                                console.error('Error deleting medication:', error);
                                Alert.alert(t('common.error'), t('medications.deleteError'));
                              }
                            }}
                          >
                            <Ionicons name="trash-outline" size={24} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.medicationDose}>{item.dose}</Text>
                      
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { 
                            width: `${item.takenDates ? 
                              Math.round((item.takenDates.length / item.duration) * 100) : 0}%` 
                          }]} />
                        </View>
                        <Text style={styles.progressText}>
                          {item.takenDates ? 
                            Math.round((item.takenDates.length / item.duration) * 100) : 0}% {t('medications.overallProgress')}
                        </Text>
                      </View>

                      <View style={styles.timesContainer}>
                        {item.times.map((time, index) => (
                          <View key={index} style={styles.timeBadge}>
                            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                            <Text style={styles.timeText}>{formatTime(time)}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  </View>
                ),
                ListEmptyComponent: () => (
                  <View style={styles.emptyMedicationsContainer}>
                    <Ionicons name="medical-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.emptyText}>{t('medications.noMedications')}</Text>
                    <TouchableOpacity
                      style={styles.addFirstButton}
                      onPress={() => navigation.navigate('AddMedication')}
                    >
                      <Text style={styles.addFirstButtonText}>{t('medications.addFirstMedication')}</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            ]}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>{title === 'Today\'s Schedule' ? 
                  format(new Date(), 'EEEE, MMMM d') : 
                  t('medications.yourMedications')}</Text>
              </View>
            )}
            stickySectionHeadersEnabled={false}
            keyExtractor={(item) => item.id}
            style={styles.listContainer}
          />
        </>
      )}
    </SafeAreaViewContext>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  addMedicationContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  addMedicationButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addMedicationButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyMedicationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  sectionHeaderContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  addFirstButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  medicationListCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationCardTitle: {
    flex: 1,
  },
  medicationCardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  medicationDose: {
    fontSize: 14,
    color: '#64748B',
  },
  timesList: {
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  takeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  takenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  takenText: {
    marginLeft: 4,
    color: '#10B981',
    fontWeight: '500',
    fontSize: 14,
  },
}); 