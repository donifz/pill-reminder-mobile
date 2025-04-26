import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { pharmacyService, Medicine } from '../services/api';
import { useTranslation } from 'react-i18next';

type PharmacyDetailsRouteProp = RouteProp<RootStackParamList, 'PharmacyDetails'>;
type PharmacyDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PharmacyDetails'>;

export const PharmacyDetailsScreen: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const route = useRoute<PharmacyDetailsRouteProp>();
  const navigation = useNavigation<PharmacyDetailsNavigationProp>();
  const { id, name } = route.params;
  const { t } = useTranslation();

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pharmacyMedicines = await pharmacyService.getMedicines(id);
        setMedicines(pharmacyMedicines);
        setLoading(false);
      } catch (error) {
        console.error('Error loading pharmacy medicines:', error);
        setError(t('pharmacies.errorLoadingMedicines'));
        setLoading(false);
      }
    };
    
    loadMedicines();
  }, [id, t]);

  const handleOpenMaps = () => {
    // This would typically open Google Maps or Apple Maps with the pharmacy location
    Alert.alert(t('common.comingSoon'), t('pharmacies.mapsIntegrationSoon'));
  };

  const handleCallPharmacy = () => {
    // This would typically make a phone call to the pharmacy
    Alert.alert(t('common.comingSoon'), t('pharmacies.callIntegrationSoon'));
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <View style={styles.medicineCard}>
      <View style={styles.medicineIconContainer}>
        <Ionicons name="medical" size={24} color="#3B82F6" />
      </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.name}</Text>
        {item.genericName && (
          <Text style={styles.medicineGenericName}>{item.genericName}</Text>
        )}
      </View>
      <View style={[
        styles.availabilityIndicator,
        { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }
      ]}>
        <Text style={styles.availabilityText}>
          {item.isAvailable ? t('medicines.inStock') : t('medicines.outOfStock')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>{t('pharmacies.directions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCallPharmacy}>
          <Ionicons name="call" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>{t('pharmacies.call')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('pharmacies.availableMedicines')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.medicinesList}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Ionicons name="medical-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyListText}>{t('pharmacies.noMedicinesFound')}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
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
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinesList: {
    padding: 16,
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medicineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  medicineGenericName: {
    fontSize: 14,
    color: '#64748B',
  },
  availabilityIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyListText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
}); 