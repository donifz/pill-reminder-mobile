import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { medicationService, Medication } from '../services/medicationService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage } from '../i18n';
import { doctorService, pharmacyService, Pharmacy, Doctor } from '../services/api';
import * as Location from 'expo-location';
import { TodaysMedicationsCard } from '../components/TodaysMedicationsCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const MedicationCard: React.FC<{
  medication: Medication;
  onPress: () => void;
  onTake?: () => void;
  onDelete?: () => void;
  isGuardian?: boolean;
  userName?: string;
}> = ({ medication, onPress, onTake, onDelete, isGuardian, userName }) => {
  const { t } = useTranslation();

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getProgress = () => {
    if (!medication.takenDates) return 0;
    const totalDays = medication.duration;
    const takenDays = medication.takenDates.length;
    return Math.round((takenDays / totalDays) * 100);
  };

  const getNextDose = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const sortedTimes = [...medication.times].sort();
    return sortedTimes.find(time => time > currentTime) || sortedTimes[0];
  };

  const areAllDosesTakenToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTaken = medication.takenDates?.find(td => td.date === today);
    return todayTaken?.times.length === medication.times.length;
  };

  const progress = getProgress();
  const nextDose = getNextDose();
  const allDosesTakenToday = areAllDosesTakenToday();

  return (
    <TouchableOpacity
      style={[styles.medicationCard, allDosesTakenToday && styles.medicationCardTaken]}
      onPress={onPress}
    >
      <View style={styles.medicationCardContent}>
        <View style={styles.medicationCardHeader}>
          <View style={styles.medicationCardTitle}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            {userName && (
              <View style={styles.userNameContainer}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.userName}>{userName}</Text>
              </View>
            )}
          </View>
          <View style={styles.medicationCardActions}>
            {onTake && (
              <TouchableOpacity
                style={[styles.actionButton, allDosesTakenToday && styles.actionButtonTaken]}
                onPress={onTake}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={allDosesTakenToday ? '#059669' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
            {!isGuardian && onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.medicationDose}>{medication.dose}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('medications.overallProgress', { progress })}
          </Text>
        </View>

        <View style={styles.timesContainer}>
          {medication.times.map((time, index) => {
            const isNextDose = time === nextDose;
            const today = new Date().toISOString().split('T')[0];
            const takenDate = medication.takenDates?.find(td => td.date === today);
            const isTaken = takenDate?.times.includes(time);
            
            return (
              <View 
                key={index} 
                style={[
                  styles.timeBadge,
                  isNextDose && styles.nextDoseBadge,
                  isTaken && styles.takenTimeBadge
                ]}
              >
                <Ionicons 
                  name={isTaken ? "checkmark-circle" : "time-outline"} 
                  size={16} 
                  color={isTaken ? "#059669" : isNextDose ? "#3B82F6" : "#9CA3AF"} 
                />
                <Text style={[
                  styles.timeText,
                  isNextDose && styles.nextDoseText,
                  isTaken && styles.takenTimeText
                ]}>
                  {formatTime(time)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const [userMedications, setUserMedications] = useState<Medication[]>([]);
  const [guardianMedications, setGuardianMedications] = useState<{
    user: { id: string; name: string; email: string };
    medications: Medication[];
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<{
    doctor: Doctor;
    date: string;
    time: string;
  } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const loadMedications = async () => {
    try {
      setLoading(true);
      console.log('Loading medications from API...');
      
      // Get the latest medications from the API
      const result = await medicationService.getMedications();
      console.log(`API returned ${result.userMedications?.length || 0} user medications`);
      
      if (result.userMedications) {
        console.log('Medication IDs received:', result.userMedications.map(m => m.id).join(', '));
      }
      
      setUserMedications(result.userMedications || []);
      setGuardianMedications(result.guardianMedications || []);
      
      const todaysCount = getTodaysMedications().length;
      console.log(`Found ${todaysCount} medications for today after updating state`);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert(
        t('common.error'),
        t('medications.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user's location
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationPermissionDenied(true);
          setLoading(false);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // Fetch nearby pharmacies
        const nearbyPharmacies = await pharmacyService.getNearby(latitude, longitude, 2000);
        
        // Calculate distances for each pharmacy
        const pharmaciesWithDistance = nearbyPharmacies.map(pharmacy => {
          // Calculate distance in miles or kilometers (simplified version)
          const distance = calculateDistance(
            latitude, 
            longitude, 
            pharmacy.location?.latitude || 0,
            pharmacy.location?.longitude || 0
          );
          
          return {
            ...pharmacy,
            distance: `${distance.toFixed(1)} miles away`
          };
        });
        
        setPharmacies(pharmaciesWithDistance);
        
        // Fetch upcoming appointment
        const appointment = await doctorService.getUpcomingAppointment();
        setUpcomingAppointment(appointment);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Simple function to calculate distance between two coordinates (in miles)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if ((lat1 === lat2) && (lon1 === lon2)) {
      return 0;
    }
    
    const radlat1 = Math.PI * lat1/180;
    const radlat2 = Math.PI * lat2/180;
    const theta = lon1-lon2;
    const radtheta = Math.PI * theta/180;
    
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + 
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    
    if (dist > 1) {
      dist = 1;
    }
    
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515; // Miles
    
    return dist;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleTakeMedication = async (id: string) => {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      // Use the new takeDose function from medicationService
      await medicationService.takeDose(id, currentTime);
      
      loadMedications();
    } catch (error) {
      console.error('Error taking medication:', error);
      Alert.alert('Error', 'Failed to update medication status');
    }
  };

  const handleDeleteMedication = async (id: string) => {
    try {
      await medicationService.deleteMedication(id);
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Error', 'Failed to delete medication');
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    try {
      await changeLanguage(langCode);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language');
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('MedicineSearch');
    }
  };

  const handleCategoryPress = (category: string) => {
    navigation.navigate('MedicalCategory', { category });
  };

  const handlePharmacyPress = (pharmacy: Pharmacy) => {
    navigation.navigate('PharmacyDetails', {
      id: pharmacy.id,
      name: pharmacy.name
    });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={64} color="#CBD5E1" />
      <Text style={styles.emptyText}>
        {t('medications.noMedications')}
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Text style={styles.addFirstButtonText}>{t('medications.addFirstMedication')}</Text>
      </TouchableOpacity>
    </View>
  );

  const getTodaysMedications = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Looking for medications for today (${todayStr})`);
    console.log(`User medications count: ${userMedications.length}`);
    
    // Filter user medications for today
    const userMedsForToday = userMedications.filter((medication) => {
      console.log(`Checking medication: ${medication.name} (ID: ${medication.id})`);
      
      if (!medication.times || medication.times.length === 0) {
        console.log(`- No times scheduled for ${medication.name}`);
        return false;
      }
      
      // Check if the medication is active for today (between start and end dates)
      const startDate = new Date(medication.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(medication.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      const isActive = startDate <= today && today <= endDate;
      
      if (!isActive) {
        console.log(`- Medication ${medication.name} is not active for today (startDate: ${medication.startDate}, endDate: ${medication.endDate})`);
        return false;
      }
      
      console.log(`- Medication ${medication.name} is active for today with ${medication.times.length} scheduled times`);
      
      // Check if any doses were taken today
      const takenToday = medication.takenDates?.some(
        takenDate => takenDate.date === todayStr
      );
      
      if (takenToday) {
        console.log(`- Medication ${medication.name} has doses taken today`);
      }
      
      return isActive;
    });
    
    console.log(`Found ${userMedsForToday.length} user medications for today`);
    
    // Process guardian medications if needed
    // ... existing code for guardian medications ...
    
    return userMedsForToday;
  }, [userMedications, guardianMedications]);

  const todaysMedications = getTodaysMedications();

  // Load medications when component mounts or when language changes
  useEffect(() => {
    loadMedications();
  }, [i18n.language]);

  // Refresh data when screen comes into focus (e.g., after adding medication)
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - loading medications...');
      
      // Add a small delay to make sure the effect runs after navigation is complete
      const timer = setTimeout(() => {
        console.log('HomeScreen: Executing delayed loadMedications after navigation');
        loadMedications().then(() => {
          console.log('HomeScreen: Medications loaded after focus');
          
          // Force re-execution of getTodaysMedications after data is loaded
          const todaysMeds = getTodaysMedications();
          console.log(`HomeScreen: After focus, found ${todaysMeds.length} medications for today`);
          if (todaysMeds.length > 0) {
            console.log('Today\'s medications:', todaysMeds.map(m => m.name));
          }
        });
      }, 500); // Increased delay to ensure API calls complete
      
      return () => clearTimeout(timer);
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>{t('home.welcomeBack')}</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => navigation.navigate('MedicineSearch')}
        >
          <Ionicons name="search" size={20} color="#94A3B8" />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        </TouchableOpacity>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('home.medicalCategories')}</Text>
          <View style={styles.categoriesContainer}>
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleCategoryPress('dentist')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="medical-outline" size={24} color="#0EA5E9" />
              </View>
              <Text style={styles.categoryText}>{t('categories.dentist')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleCategoryPress('cardio')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#FECDD3' }]}>
                <Ionicons name="heart-outline" size={24} color="#E11D48" />
              </View>
              <Text style={styles.categoryText}>{t('categories.cardio')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleCategoryPress('neuro')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="medkit-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.categoryText}>{t('categories.neuro')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.categoryItem}
              onPress={() => handleCategoryPress('eye')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="eye-outline" size={24} color="#6366F1" />
              </View>
              <Text style={styles.categoryText}>{t('categories.eye')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Medication */}
        {todaysMedications.length > 0 && (
          <TodaysMedicationsCard medication={todaysMedications[0]} />
        )}

        {upcomingAppointment && (
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentTitle}>{t('appointments.upcoming')}</Text>
            <View style={styles.appointmentDetails}>
              <View style={styles.doctorSection}>
                <View style={styles.doctorAvatarContainer}>
                  {upcomingAppointment.doctor.imageUrl ? (
                    <Image 
                      source={{ uri: upcomingAppointment.doctor.imageUrl }} 
                      style={styles.doctorAvatar} 
                    />
                  ) : (
                    <View style={styles.doctorAvatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#94A3B8" />
                    </View>
                  )}
                </View>
                <Text style={styles.doctorName}>Dr. {upcomingAppointment.doctor.name}</Text>
              </View>
              <View style={styles.appointmentTimeContainer}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                <Text style={styles.appointmentTime}>
                  {upcomingAppointment.date}, {upcomingAppointment.time}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('pharmacies.nearby')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PharmacyList')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {pharmacies.length > 0 ? (
            pharmacies.slice(0, 2).map((pharmacy, index) => (
              <TouchableOpacity 
                key={pharmacy.id} 
                style={styles.pharmacyCard}
                onPress={() => handlePharmacyPress(pharmacy)}
              >
                <View style={styles.pharmacyIconContainer}>
                  <Ionicons name="medkit-outline" size={24} color="#3B82F6" />
                </View>
                <View style={styles.pharmacyInfo}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <Text style={styles.pharmacyDistance}>{pharmacy.distance}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
            ))
          ) : locationPermissionDenied ? (
            <View style={styles.locationPermissionContainer}>
              <Text style={styles.locationPermissionText}>
                {t('pharmacies.locationPermissionRequired')}
              </Text>
              <TouchableOpacity 
                style={styles.locationPermissionButton}
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted') {
                    setLocationPermissionDenied(false);
                    // Re-fetch data
                    navigation.replace('Home');
                  }
                }}
              >
                <Text style={styles.locationPermissionButtonText}>
                  {t('pharmacies.grantPermission')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color="#3B82F6" />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.languageList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    i18n.language === lang.code && styles.selectedLanguageItem
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={[
                    styles.languageItemText,
                    i18n.language === lang.code && styles.selectedLanguageItemText
                  ]}>
                    {lang.name}
                  </Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 12,
    color: '#64748B',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#94A3B8',
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: '23%',
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  appointmentDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorAvatarContainer: {
    marginRight: 12,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  doctorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pharmacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  pharmacyDistance: {
    fontSize: 14,
    color: '#64748B',
  },
  locationPermissionContainer: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  locationPermissionText: {
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 12,
  },
  locationPermissionButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  locationPermissionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  addButtonContainer: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addFirstButton: {
    marginTop: 8,
  },
  addFirstButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  medicationList: {
    flex: 1,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationCardTaken: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  medicationCardContent: {
    padding: 16,
  },
  medicationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicationCardTitle: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  medicationCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButtonTaken: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
  },
  medicationDose: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  guardianSection: {
    marginBottom: 24,
  },
  guardianName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageList: {
    marginBottom: 10,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedLanguageItem: {
    backgroundColor: '#e6f2ff',
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  languageItemText: {
    fontSize: 16,
  },
  selectedLanguageItemText: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  nextDoseBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  takenTimeBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nextDoseText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  takenTimeText: {
    color: '#059669',
  },
}); 