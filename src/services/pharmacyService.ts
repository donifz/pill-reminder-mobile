import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

// Use the same API_URL as other services
const API_URL = getApiUrl();

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

class PharmacyService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getNearby(latitude: number, longitude: number, radius: number = 1000): Promise<Pharmacy[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      console.log(`Fetching nearby pharmacies at lat:${latitude}, lng:${longitude}, radius:${radius}`);
      
      try {
        const response = await axios.get<Pharmacy[]>(`${API_URL}/pharmacies/nearby`, {
          params: { latitude, longitude, radius },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000 // 5 second timeout
        });
        
        return response.data;
      } catch (error: any) {
        console.error('Error fetching nearby pharmacies:', error);
        
        // Return mock data as fallback
        console.log('Returning mock pharmacy data as fallback');
        return this.getMockPharmacies();
      }
    } catch (error: any) {
      console.error('Get nearby pharmacies error:', error);
      // Return mock data on error
      return this.getMockPharmacies();
    }
  }

  async getPharmacyById(id: string): Promise<Pharmacy> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      try {
        const response = await axios.get<Pharmacy>(`${API_URL}/pharmacies/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching pharmacy details, using mock data:', error);
        const mockPharmacy = this.getMockPharmacies().find(p => p.id === id);
        if (!mockPharmacy) throw new Error('Pharmacy not found');
        return mockPharmacy;
      }
    } catch (error: any) {
      console.error('Get pharmacy by id error:', error);
      throw error;
    }
  }

  // Mock data for when API fails
  private getMockPharmacies(): Pharmacy[] {
    return [
      {
        id: '1',
        name: 'City Pharmacy',
        address: '123 Main St, City',
        phone: '(555) 123-4567',
        distance: '0.5 miles away',
        location: { latitude: 40.7128, longitude: -74.0060 }
      },
      {
        id: '2',
        name: 'Health Plus Pharmacy',
        address: '456 Oak St, Downtown',
        phone: '(555) 987-6543',
        distance: '1.2 miles away',
        location: { latitude: 40.7138, longitude: -74.0065 }
      },
      {
        id: '3',
        name: 'MediQuick Pharmacy',
        address: '789 Pine St, Uptown',
        phone: '(555) 246-8101',
        distance: '1.8 miles away',
        location: { latitude: 40.7148, longitude: -74.0070 }
      }
    ];
  }
}

export const pharmacyService = new PharmacyService(); 