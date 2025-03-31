import axios from 'axios';

// Use the same API_URL as authService
const API_URL = 'http://10.0.2.2:3001';

export type Medication = {
  id: string;
  name: string;
  dose: string;
  times: string[];
  taken: boolean;
  userId: string;
  startDate: string;
  endDate: string;
  duration: number;
  takenDates: string[];
};

export type CreateMedicationData = {
  name: string;
  dose: string;
  times: string[];
  duration: number;
  startDate: string;
  endDate: string;
};

class MedicationService {
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
  async takeMedication(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/medications/${id}/take`, {
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
}

export const medicationService = new MedicationService(); 