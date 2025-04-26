import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { pharmacyService, Pharmacy } from '../services/api';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

type PharmacyListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PharmacyList'>;

export const PharmacyListScreen: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<PharmacyListScreenNavigationProp>();
  const { t } = useTranslation();

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError(t('pharmacies.locationPermissionDenied'));
          setLoading(false);
          return;
        }
        
        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        // Fetch nearby pharmacies
        const nearbyPharmacies = await pharmacyService.getNearby(latitude, longitude, 2000);
        
        // Calculate distance for each pharmacy
        const pharmaciesWithDistance = nearbyPharmacies.map(pharmacy => {
          // Calculate distance in miles or kilometers
          const distance = calculateDistance(
            latitude,
            longitude,
            pharmacy.location?.latitude || 0,
            pharmacy.location?.longitude || 0
          );
          
          return {
            ...pharmacy,
            distance: `${distance.toFixed(1)} ${t('common.miles')}`
          };
        });
        
        setPharmacies(pharmaciesWithDistance);
        setLoading(false);
      } catch (error) {
        console.error('Error loading pharmacies:', error);
        setError(t('pharmacies.errorLoading'));
        setLoading(false);
      }
    };
    
    loadPharmacies();
  }, [t]);

  // Calculate distance between two coordinates (in miles)
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

  const handlePharmacyPress = (pharmacy: Pharmacy) => {
    navigation.navigate('PharmacyDetails', {
      id: pharmacy.id,
      name: pharmacy.name
    });
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      style={styles.pharmacyCard}
      onPress={() => handlePharmacyPress(item)}
    >
      <View style={styles.pharmacyIconContainer}>
        <Ionicons name="medical" size={24} color="#3B82F6" />
      </View>
      <View style={styles.pharmacyInfo}>
        <Text style={styles.pharmacyName}>{item.name}</Text>
        <Text style={styles.pharmacyAddress}>{item.address}</Text>
        <View style={styles.pharmacyDetails}>
          <View style={styles.pharmacyDetail}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.pharmacyDetailText}>{item.distance}</Text>
          </View>
          {item.rating && (
            <View style={styles.pharmacyDetail}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.pharmacyDetailText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          {item.openNow !== undefined && (
            <View style={styles.pharmacyDetail}>
              <View style={[
                styles.statusDot,
                { backgroundColor: item.openNow ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.pharmacyDetailText}>
                {item.openNow ? t('pharmacies.open') : t('pharmacies.closed')}
              </Text>
            </View>
          )}
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
        <Text style={styles.headerTitle}>{t('pharmacies.nearbyPharmacies')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('PharmacyList')}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pharmacies}
          renderItem={renderPharmacyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.pharmaciesList}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Ionicons name="medkit-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyListText}>{t('pharmacies.noPharmaciesFound')}</Text>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmaciesList: {
    padding: 16,
  },
  pharmacyCard: {
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
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  pharmacyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pharmacyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  pharmacyDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
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
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 