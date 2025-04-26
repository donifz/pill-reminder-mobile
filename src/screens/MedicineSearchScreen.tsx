import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { medicineService, Medicine } from '../services/api';
import { useTranslation } from 'react-i18next';

type MedicineSearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MedicineSearch'>;

export const MedicineSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [genericName, setGenericName] = useState('');
  const navigation = useNavigation<MedicineSearchScreenNavigationProp>();
  const { t } = useTranslation();

  const handleSearch = async () => {
    try {
      setLoading(true);
      const results = await medicineService.search({
        name: searchQuery,
        genericName: genericName || undefined,
      });
      setMedicines(results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching medicines:', error);
      setLoading(false);
    }
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <TouchableOpacity
      style={styles.medicineCard}
      onPress={() => {
        // Navigate to medicine details or check availability in pharmacies
      }}
    >
      <View style={styles.medicineIconContainer}>
        <Ionicons name="medical" size={24} color="#3B82F6" />
      </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName}>{item.name}</Text>
        {item.genericName && (
          <Text style={styles.medicineGenericName}>{item.genericName}</Text>
        )}
        <View style={styles.availabilityContainer}>
          <View style={[
            styles.availabilityDot,
            { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }
          ]} />
          <Text style={styles.availabilityText}>
            {item.isAvailable ? t('medicines.available') : t('medicines.unavailable')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('medicines.searchTitle')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('medicines.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>{t('medicines.genericName')}:</Text>
          <TextInput
            style={styles.filterInput}
            placeholder={t('medicines.genericNamePlaceholder')}
            value={genericName}
            onChangeText={setGenericName}
          />
        </View>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>{t('common.search')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : (
        <FlatList
          data={medicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.medicinesList}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Ionicons name="medical-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyListText}>
                {searchQuery
                  ? t('medicines.noResultsFound')
                  : t('medicines.searchForMedicines')}
              </Text>
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
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#0F172A',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  medicineGenericName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: '#64748B',
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
}); 