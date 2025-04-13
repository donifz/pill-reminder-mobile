import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

// Use the same API_URL as authService
const API_URL = getApiUrl();

export interface Medication {
  id: string;
  name: string;
  dose: string;
  times: string[];
  duration: number;
  startDate: string;
  endDate: string;
  taken: boolean;
  takenDates: { date: string; times: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export type CreateMedicationData = {
  name: string;
  dose: string;
  times: string[];
  duration: number;
  startDate: string;
  endDate: string;
};

export interface MedicationsResponse {
  userMedications: Medication[];
  guardianMedications: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    medications: Medication[];
  }[];
}

class MedicationService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getMedications(): Promise<Medication[]> {
    try {
      console.log('Fetching medications from:', `${API_URL}/medications`);
      const response = await axios.get(`${API_URL}/medications`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Medications response:', response.data);
      // Combine user medications and guardian medications into a single array
      const allMedications = [
        ...response.data.userMedications,
        ...response.data.guardianMedications.flatMap(g => g.medications)
      ];
      return allMedications;
    } catch (error: any) {
      console.error('Get medications error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async getMedicationById(id: string): Promise<Medication> {
    try {
      console.log('Fetching medication details:', `${API_URL}/medications/${id}`);
      const response = await axios.get(`${API_URL}/medications/${id}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Medication details response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get medication details error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async createMedication(data: CreateMedicationData): Promise<Medication> {
    try {
      const response = await axios.post(`${API_URL}/medications`, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Create medication response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Create medication error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async deleteMedication(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/medications/${id}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error: any) {
      console.error('Delete medication error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  async toggleTaken(id: string, date: string, time: string): Promise<Medication> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const response = await axios.patch<Medication>(`${API_URL}/medications/${id}/toggle`, { date, time }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const medicationService = new MedicationService(); 