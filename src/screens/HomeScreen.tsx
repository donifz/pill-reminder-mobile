import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { medicationService, Medication } from '../services/medicationService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { languages, changeLanguage } from '../i18n';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const MedicationCard: React.FC<{
  medication: Medication;
  onPress: () => void;
  onTake?: () => void;
  onDelete?: () => void;
  isGuardian?: boolean;
  userName?: string;
}> = ({ medication, onPress, onTake, onDelete, isGuardian, userName }) => {
const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

  return (
    <TouchableOpacity
      style={[styles.medicationCard, medication.taken && styles.medicationCardTaken]}
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
                style={[styles.actionButton, medication.taken && styles.actionButtonTaken]}
                onPress={onTake}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={medication.taken ? '#059669' : '#9CA3AF'}
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
        <View style={styles.timesContainer}>
          {medication.times.map((time, index) => (
            <View key={index} style={styles.timeBadge}>
              <Ionicons name="time-outline" size={16} color="#9CA3AF" />
              <Text style={styles.timeText}>{formatTime(time)}</Text>
            </View>
          ))}
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
  const [activeTab, setActiveTab] = useState<'user' | 'guardian'>('user');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await medicationService.getMedications();
      setUserMedications(response.userMedications);
      setGuardianMedications(response.guardianMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

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
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      await medicationService.toggleTaken(id, today, currentTime);
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No {activeTab === 'user' ? 'medications' : 'guardian medications'} found
      </Text>
      {activeTab === 'user' && (
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => navigation.navigate('AddMedication')}
        >
          <Text style={styles.addFirstButtonText}>Add your first medication</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('common.welcome')}</Text>
          {user && (
            <Text style={styles.userName}>{t('common.hello')}, {user.name}</Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('GuardianManagement')}
          >
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
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
                    i18n.language === lang.code && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      i18n.language === lang.code && styles.selectedLanguageItemText,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'user' && styles.activeTab]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>
            {t('medications.myMedications')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'guardian' && styles.activeTab]}
          onPress={() => setActiveTab('guardian')}
        >
          <Text style={[styles.tabText, activeTab === 'guardian' && styles.activeTabText]}>
            {t('medications.guardianMedications')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'user' ? (
          <>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddMedication')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>{t('medications.addMedication')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={userMedications}
              renderItem={({ item }) => (
                <MedicationCard
                  medication={item}
                  onPress={() => navigation.navigate('MedicationDetails', { id: item.id })}
                  onTake={() => handleTakeMedication(item.id)}
                  onDelete={() => handleDeleteMedication(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyList}
            />
          </>
        ) : (
          <ScrollView style={styles.medicationList}>
            {guardianMedications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('medications.noGuardianMedications')}</Text>
              </View>
            ) : (
              guardianMedications.map((guardianMed) => (
                <View key={guardianMed.user.id} style={styles.guardianSection}>
                  <Text style={styles.guardianName}>{guardianMed.user.name} {t('medications.guardiansMedications', { name: guardianMed.user.name })}</Text>
                  {guardianMed.medications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      onPress={() => navigation.navigate('MedicationDetails', { id: medication.id })}
                      onTake={() => handleTakeMedication(medication.id)}
                      isGuardian
                      userName={guardianMed.user.name}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
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
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
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
  userName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
}); 