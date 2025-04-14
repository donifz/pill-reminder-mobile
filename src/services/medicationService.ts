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
  taken: boolean;
  startDate: string;
  endDate: string;
  duration: number;
  takenDates?: { date: string; times: string[] }[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

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

export interface CreateMedicationDto {
  name: string;
  dose: string;
  times: string[];
  duration: number;
  startDate: string;
  endDate: string;
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

  async getMedications(): Promise<MedicationsResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      console.log('Fetching medications from:', `${API_URL}/medications`);
      const response = await axios.get<MedicationsResponse>(`${API_URL}/medications`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Medications response:', response.data);
      return response.data;
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
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get<Medication>(`${API_URL}/medications/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get medication by id error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async createMedication(dto: CreateMedicationDto): Promise<Medication> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.post<Medication>(`${API_URL}/medications`, dto, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Create medication error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async toggleTaken(id: string, date: string, time: string): Promise<Medication> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.patch<Medication>(
        `${API_URL}/medications/${id}/toggle`,
        { date, time },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Toggle taken error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async deleteMedication(id: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`${API_URL}/medications/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error: any) {
      console.error('Delete medication error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }
}

export const medicationService = new MedicationService(); 